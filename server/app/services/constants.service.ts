import { CONFIGURATION_GAME_CONSTANTS } from '@common/constants';
import { GameConstants } from '@common/interfaces';
import * as io from 'socket.io';

export class ConstantsService {
    gameConstants: GameConstants[] = CONFIGURATION_GAME_CONSTANTS;
    sio: io.Server;
    handleConstants(socket: io.Socket, sio: io.Server): void {
        this.sio = sio;
        socket.on('constant', (info: GameConstants[]) => {
            this.gameConstants = info;
            socket.broadcast.emit('constant', this.gameConstants);
        });

        socket.on('getConstant', () => {
            socket.emit('loadConstant', this.gameConstants);
        });
    }
}
