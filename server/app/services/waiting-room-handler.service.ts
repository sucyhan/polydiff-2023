import { EMPTY_INDEX, GAME_PLAYER_MODE } from '@common/constants';
import { DisconnectMessage, UserWaiting } from '@common/interfaces';
import { UsernameMessage } from '@common/messages';
import * as io from 'socket.io';
import { StorageService } from './storage.service';
import { UsernameService } from './username.service';
import { WaitingRoomService } from './waiting-room.service';

export class WaitingRoomHandler {
    constructor(
        private readonly waitingRoomService: WaitingRoomService,
        private readonly usernameService: UsernameService,
        private readonly storageService: StorageService,
    ) {}

    handleWaitingRoom(socket: io.Socket, sio: io.Server) {
        socket.on('createWaitingRoom', (data: [number, string]) => {
            this.waitingRoomService.add({ creatorId: socket.id, room: data[0] + data[1], gameId: data[0] - 1, waitingLine: [] });
            socket.join(data[0].toString());
            sio.sockets.emit('createdGame', data[0]);
        });

        socket.on('deletedFromServer', (id: number) => {
            sio.to(id.toString()).emit('deletedFromServer');
            socket.broadcast.emit('cardDeleted', id);
            sio.sockets.emit('numberGamesChanged');
        });

        socket.on('deleteWaitingRoom', (id: number) => {
            socket.leave(id.toString());
            this.waitingRoomService.deleteWaitingRoom(id - 1);
            socket.broadcast.to(id.toString()).emit('deletedWaitingRoom', id);
            sio.sockets.emit('roomClosed', id);
            sio.sockets.emit('creatorLeft', id);
            this.usernameService.removeAllUserFromId(id);
        });

        socket.on('deletedEverythingFromServer', () => {
            socket.broadcast.emit('deletedFromServer');
            sio.sockets.emit('cardDeleted');
            sio.sockets.emit('numberGamesChanged');
        });

        socket.on('verifyUsername', (usernameMessage: UsernameMessage) => {
            if (this.usernameService.isUsernameAvailable(usernameMessage).valid) {
                this.usernameService.addUsername(usernameMessage);
                socket.emit('verifyUsername', true);
            } else {
                socket.emit('verifyUsername', false);
            }
        });

        socket.on('isCardCreating', (id: number) => {
            socket.emit('isCardCreating', [this.waitingRoomService.isWaitingRoom(id), id]);
        });

        socket.on('rejected', (id: number) => {
            const roomIndex = this.waitingRoomService.findWaitingRoom(id - 1);
            socket.to(this.waitingRoomService.get(roomIndex).waitingLine[0].socketId).emit('rejected', id);
            this.usernameService.removeUsername({ username: this.waitingRoomService.get(roomIndex).waitingLine[0].userName, id: id - 1 });
            this.waitingRoomService.get(roomIndex).waitingLine.shift();
            if (this.waitingRoomService.get(roomIndex).waitingLine.length === 0) {
                socket.emit('emptyLine', id);
            } else {
                socket.emit('nextOpponent', this.waitingRoomService.get(roomIndex).waitingLine[0]);
            }
        });

        socket.on('accepted', (data: [string, number, string]) => {
            const roomIndex = this.waitingRoomService.findWaitingRoom(data[1] - 1);
            const url =
                data[0] +
                '/' +
                GAME_PLAYER_MODE.MULTI_PLAYER +
                '/' +
                (data[1] - 1).toString() +
                '/' +
                this.waitingRoomService.createNewGameRoom(data[1]) +
                '/';
            socket.emit('accepted', url + data[2]);
            socket
                .to(this.waitingRoomService.get(roomIndex).waitingLine[0].socketId)
                .emit('accepted', url + this.waitingRoomService.get(roomIndex).waitingLine[0].userName);
            this.waitingRoomService.deleteWaitingRoom(data[1] - 1);
            sio.sockets.emit('deletedWaitingRoom', data[1]);
            sio.sockets.emit('roomClosed', data[1]);
            this.usernameService.removeAllUserFromId(data[1]);
        });

        socket.on('quitLine', (id: number) => {
            const roomIndex = this.waitingRoomService.findWaitingRoom(id - 1);
            const positionInLine = this.waitingRoomService.isUserInWaitingLine(socket.id, this.waitingRoomService.get(roomIndex)).position;
            this.usernameService.removeUsername({
                username: this.waitingRoomService.get(roomIndex).waitingLine[positionInLine].userName,
                id: id - 1,
            });
            this.waitingRoomService.get(roomIndex).waitingLine.splice(positionInLine, 1);
            socket.leave(id.toString());
            if (this.waitingRoomService.get(roomIndex).waitingLine.length === 0) {
                socket.to(this.waitingRoomService.get(roomIndex).creatorId).emit('emptyLine', id);
            } else if (positionInLine === 0) {
                socket
                    .to(this.waitingRoomService.get(roomIndex).creatorId)
                    .emit('nextOpponent', this.waitingRoomService.get(roomIndex).waitingLine[0]);
            }
        });

        socket.on('joinWaitingRoom', (data: [number, UserWaiting]) => {
            const roomIndex = this.waitingRoomService.findWaitingRoom(data[0] - 1);
            if (roomIndex === EMPTY_INDEX) {
                socket.emit('deletedRoom', data[0]);
                return;
            }
            socket.emit('joined');
            socket.join(data[0].toString());
            if (this.waitingRoomService.get(roomIndex).waitingLine.length === 0) {
                socket.to(this.waitingRoomService.get(roomIndex).creatorId).emit('nextOpponent', data[1]);
            }

            this.waitingRoomService.get(roomIndex).waitingLine.push(data[1]);
        });

        socket.on('timedCheckUsername', (username: string) => {
            if (this.waitingRoomService.timedUsernameIsTaken(username)) socket.emit('timedUsernameTaken');
            else socket.emit('timedUsernameAvailable');
        });

        socket.on('timedFindGame', async (username: string) => {
            const users = this.waitingRoomService.timedFindGame(username, socket.id);
            if (users.length === 2) {
                const room = this.waitingRoomService.timedWaitingRoomCounter.toString();
                this.waitingRoomService.timedWaitingRoomCounter++;
                const validIds = (await this.storageService.getValidIds()).validIds;
                const randomIndex: number = Math.floor(Math.random() * validIds.length);
                users.forEach((user) => {
                    sio.to(user.socketId).emit('timedGameFound', [validIds[randomIndex], room, user.userName]);
                });
            }
        });

        socket.on('timedAbandon', () => {
            this.waitingRoomService.timedRemoveUser(socket.id);
        });

        socket.on('createdGameCard', () => {
            sio.sockets.emit('numberGamesChanged');
        });
    }

    disconnect(socket: io.Socket, sio: io.Server) {
        const findDisconnectedUser: DisconnectMessage = this.waitingRoomService.handleWaitingRoomDisconnection(socket.id);
        this.waitingRoomService.timedRemoveUser(socket.id);
        if (findDisconnectedUser.gameId === EMPTY_INDEX) {
            return;
        } else {
            if (findDisconnectedUser.typeOfUser === 'Creator') {
                const room = this.waitingRoomService.get(findDisconnectedUser.gameId).gameId + 1;
                socket.to(room.toString()).emit('deletedWaitingRoom', this.waitingRoomService.get(findDisconnectedUser.gameId).gameId + 1);
                socket.to(room.toString()).emit('roomClosed', this.waitingRoomService.get(findDisconnectedUser.gameId).gameId + 1);
                sio.sockets.emit('creatorLeft', this.waitingRoomService.get(findDisconnectedUser.gameId).gameId + 1);
                this.waitingRoomService.deleteWaitingRoom(room - 1);
                this.usernameService.removeAllUserFromId(room);
            } else {
                this.usernameService.removeUsername({
                    username: this.waitingRoomService.get(findDisconnectedUser.gameId).waitingLine[findDisconnectedUser.waitingLineIndex].userName,
                    id: this.waitingRoomService.get(findDisconnectedUser.gameId).gameId,
                });
                this.waitingRoomService.get(findDisconnectedUser.gameId).waitingLine.splice(findDisconnectedUser.waitingLineIndex, 1);
                if (this.waitingRoomService.get(findDisconnectedUser.gameId).waitingLine.length === 0) {
                    socket
                        .to(this.waitingRoomService.get(findDisconnectedUser.gameId).creatorId)
                        .emit('emptyLine', this.waitingRoomService.get(findDisconnectedUser.gameId).gameId + 1);
                } else if (findDisconnectedUser.waitingLineIndex === 0) {
                    socket
                        .to(this.waitingRoomService.get(findDisconnectedUser.gameId).creatorId)
                        .emit('nextOpponent', this.waitingRoomService.get(findDisconnectedUser.gameId).waitingLine[0]);
                }
            }
        }
    }
}
