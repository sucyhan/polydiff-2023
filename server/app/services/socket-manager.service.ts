import { Server, Socket } from 'socket.io';
import { ConstantsService } from './constants.service';
import { GameRoomHandler } from './game-room-handler.service';
import { WaitingRoomHandler } from './waiting-room-handler.service';

export class SocketManager {
    sio: Server;

    constructor(
        private readonly waitingRoomHandler: WaitingRoomHandler,
        private readonly gameRoomHandler: GameRoomHandler,
        private readonly constantsService: ConstantsService,
    ) {}

    handleSockets(): void {
        this.sio.on('connection', (socket: Socket) => {
            this.waitingRoomHandler.handleWaitingRoom(socket, this.sio);
            this.gameRoomHandler.handleGameRoom(socket, this.sio);
            this.constantsService.handleConstants(socket, this.sio);

            socket.on('joinRoom', (room: string) => {
                socket.join(room);
            });

            socket.on('leaveRoom', (room: string) => {
                socket.leave(room);
            });

            socket.on('disconnect', () => {
                this.waitingRoomHandler.disconnect(socket, this.sio);
                this.gameRoomHandler.disconnect(socket, this.sio);
            });
        });
    }
}
