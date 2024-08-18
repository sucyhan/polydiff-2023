import { expect } from 'chai';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { ConstantsService } from './constants.service';
import { GameRoomHandler } from './game-room-handler.service';
import { SocketManager } from './socket-manager.service';
import { WaitingRoomHandler } from './waiting-room-handler.service';

describe('SocketManager Service', () => {
    let waitingRoomHandler: SinonStubbedInstance<WaitingRoomHandler>;
    let gameRoomHandler: SinonStubbedInstance<GameRoomHandler>;
    let constantsService: SinonStubbedInstance<ConstantsService>;
    let socketManager: SocketManager;

    const socketStub = {
        on: stub(),
        emit: stub(),
        broadcast: {
            emit: stub(),
        },
        join: stub(),
        leave: stub(),
    };
    let socket: Socket;
    const sioStub = {
        on: stub(),
    };
    let sio: Server;

    before(() => {
        stub(Server.prototype, 'path');
    });

    beforeEach(() => {
        waitingRoomHandler = createStubInstance(WaitingRoomHandler);
        gameRoomHandler = createStubInstance(GameRoomHandler);
        constantsService = createStubInstance(ConstantsService);
        socket = socketStub as unknown as Socket;
        sio = sioStub as unknown as Server;
        socketManager = new SocketManager(waitingRoomHandler, gameRoomHandler, constantsService);
        socketManager.sio = sio;
    });

    afterEach(() => {
        socketStub.on.reset();
        socketStub.emit.reset();
        socketStub.broadcast.emit.reset();
        socketStub.join.reset();
        socketStub.leave.reset();
        sioStub.on.reset();
    });

    it('should call sio.on with connection', () => {
        socketManager.handleSockets();
        expect(sioStub.on.calledWith('connection')).to.be.equal(true);
    });

    it('should call waitingRoomHandler.handleWaitingRoom on connection', () => {
        sioStub.on.withArgs('connection').callsArgWith(1, socket);
        socketManager.handleSockets();
        expect(waitingRoomHandler.handleWaitingRoom.calledWith(socket, sio)).to.be.equal(true);
    });

    it('should call gameRoomHandler.handleGameRoom on connection', () => {
        sioStub.on.withArgs('connection').callsArgWith(1, socket);
        socketManager.handleSockets();
        expect(gameRoomHandler.handleGameRoom.calledWith(socket, sio)).to.be.equal(true);
    });

    it('should call constantsService.handleConstants on connection', () => {
        sioStub.on.withArgs('connection').callsArgWith(1, socket);
        socketManager.handleSockets();
        expect(constantsService.handleConstants.calledWith(socket, sio)).to.be.equal(true);
    });

    it('should call socket.join on joinRoom', () => {
        sioStub.on.withArgs('connection').callsArgWith(1, socket);
        const room = 'room';
        socketStub.on.withArgs('joinRoom').callsArgWith(1, room);
        socketManager.handleSockets();
        expect(socketStub.join.calledWith(room)).to.be.equal(true);
    });

    it('should call socket.leave on leaveRoom', () => {
        sioStub.on.withArgs('connection').callsArgWith(1, socket);
        const room = 'room';
        socketStub.on.withArgs('leaveRoom').callsArgWith(1, room);
        socketManager.handleSockets();
        expect(socketStub.leave.calledWith(room)).to.be.equal(true);
    });

    it('should call waitingRoomHandler.disconnect on disconnect', () => {
        sioStub.on.withArgs('connection').callsArgWith(1, socket);
        socketStub.on.withArgs('disconnect').callsArg(1);
        socketManager.handleSockets();
        expect(waitingRoomHandler.disconnect.calledWith(socket, sio)).to.be.equal(true);
    });

    it('should call gameRoomHandler.disconnect on disconnect', () => {
        sioStub.on.withArgs('connection').callsArgWith(1, socket);
        socketStub.on.withArgs('disconnect').callsArg(1);
        socketManager.handleSockets();
        expect(gameRoomHandler.disconnect.calledWith(socket, sio)).to.be.equal(true);
    });
});
