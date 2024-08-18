import { DisconnectMessage, IsUserPosition, UserWaiting, WaitingRoom } from '@common/interfaces';
import { Service } from 'typedi';

@Service()
export class WaitingRoomService {
    createdGameRooms: { id: number; counter: number }[] = [];
    timedWaitingRoom: UserWaiting[] = [];
    timedWaitingRoomCounter = 0;
    private waitingRooms: WaitingRoom[];

    constructor() {
        this.waitingRooms = [];
    }

    add(newRoom: WaitingRoom) {
        this.waitingRooms.push(newRoom);
    }

    get(roomIndex: number) {
        return this.waitingRooms[roomIndex];
    }

    deleteWaitingRoom(id: number) {
        const index = this.findWaitingRoom(id);
        this.waitingRooms.splice(index, 1);
    }

    findWaitingRoom(id: number) {
        let index = -1;
        for (let i = 0; i < this.waitingRooms.length; i++) {
            if (this.compareWaitingRoom(id, this.waitingRooms[i])) {
                index = i;
                break;
            }
        }
        return index;
    }

    isWaitingRoom(id: number) {
        return this.findWaitingRoom(id) >= 0;
    }

    handleWaitingRoomDisconnection(socketId: string): DisconnectMessage {
        const disconnectMessage: DisconnectMessage = { gameId: -1, typeOfUser: 'None', waitingLineIndex: 0 };
        let index = 0;
        for (const waitingRoom of this.waitingRooms) {
            if (waitingRoom.creatorId === socketId) {
                disconnectMessage.gameId = index;
                disconnectMessage.typeOfUser = 'Creator';
                break;
            }
            const verification: IsUserPosition = this.isUserInWaitingLine(socketId, waitingRoom);
            if (verification.isInLine) {
                disconnectMessage.gameId = index;
                disconnectMessage.typeOfUser = 'Waiting';
                disconnectMessage.waitingLineIndex = verification.position;
            }
            index++;
        }
        return disconnectMessage;
    }

    isUserInWaitingLine(socketId: string, waitingRoom: WaitingRoom): IsUserPosition {
        let index = 0;
        for (const user of waitingRoom.waitingLine) {
            if (user.socketId === socketId) {
                return { isInLine: true, position: index };
            }
            index++;
        }
        return { isInLine: false, position: -1 };
    }

    createNewGameRoom(id: number): string {
        let currentRoom = this.createdGameRooms.find((room) => room.id === id);
        if (currentRoom) {
            currentRoom.counter++;
        } else {
            currentRoom = { id, counter: 1 };
            this.createdGameRooms.push(currentRoom);
        }
        return `${currentRoom.counter}`;
    }

    timedUsernameIsTaken(username: string): boolean {
        return this.timedWaitingRoom.find((user) => user.userName === username) !== undefined;
    }

    timedFindGame(username: string, socketId: string): UserWaiting[] {
        this.timedWaitingRoom.push({ userName: username, socketId });
        if (this.timedWaitingRoom.length >= 2) {
            return this.timedWaitingRoom.splice(0, 2);
        }
        return [];
    }

    timedRemoveUser(socketId: string): void {
        this.timedWaitingRoom = this.timedWaitingRoom.filter((user) => user.socketId !== socketId);
    }

    private compareWaitingRoom(id1: number, room: WaitingRoom) {
        return id1 === room.gameId;
    }
}
