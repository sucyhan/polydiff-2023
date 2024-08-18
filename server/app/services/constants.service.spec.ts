import { expect } from 'chai';
import { stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { ConstantsService } from './constants.service';

describe('Constants Service', () => {
    let constantsService: ConstantsService;
    const socketStub = {
        on: stub(),
        emit: stub(),
        broadcast: {
            emit: stub(),
        },
    };
    let socket: Socket;
    const sioStub = {
        on: stub(),
    };
    let sio: Server;

    beforeEach(() => {
        constantsService = new ConstantsService();
        socket = socketStub as unknown as Socket;
        sio = sioStub as unknown as Server;
    });

    it('should set gameConstants and emit it on socket.broadcast', () => {
        const info = [{ name: 'constant1', time: 0 }];
        socketStub.on.withArgs('constant').callsArgWith(1, info);
        constantsService.handleConstants(socket, sio);
        expect(constantsService.gameConstants).to.deep.equal(info);
        expect(socketStub.broadcast.emit.calledWith('constant', info)).to.be.equal(true);
    });

    it('should emit gameConstants on socket', () => {
        constantsService.gameConstants = [{ name: 'constant1', time: 0 }];
        socketStub.on.withArgs('getConstant').callsArg(1);
        constantsService.handleConstants(socket, sio);
        expect(socketStub.emit.calledWith('loadConstant', constantsService.gameConstants)).to.be.equal(true);
    });
});
