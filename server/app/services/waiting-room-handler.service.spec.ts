/* eslint-disable max-lines */
import { EMPTY_INDEX } from '@common/constants';
import { IsUserPosition, UserWaiting, WaitingRoom } from '@common/interfaces';
import { expect } from 'chai';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { StorageService } from './storage.service';
import { UsernameService } from './username.service';
import { WaitingRoomHandler } from './waiting-room-handler.service';
import { WaitingRoomService } from './waiting-room.service';

describe('WaitingRoomHandler Service', () => {
    let waitingRoomHandler: WaitingRoomHandler;
    let waitingRoomService: SinonStubbedInstance<WaitingRoomService>;
    let usernameService: SinonStubbedInstance<UsernameService>;
    let storageService: SinonStubbedInstance<StorageService>;

    const socketStub = {
        on: stub(),
        emit: stub(),
        broadcast: {
            emit: stub(),
            to: stub(),
        },
        join: stub(),
        leave: stub(),
        id: 'id',
        to: stub(),
    };
    let socket: Socket;
    const sioStub = {
        on: stub(),
        to: stub(),
        emit: stub(),
        sockets: {
            emit: stub(),
        },
    };
    let sio: Server;

    beforeEach(() => {
        waitingRoomService = createStubInstance(WaitingRoomService);
        usernameService = createStubInstance(UsernameService);
        storageService = createStubInstance(StorageService);
        waitingRoomHandler = new WaitingRoomHandler(waitingRoomService, usernameService, storageService);
        socketStub.broadcast.to.returnsThis();
        socketStub.to.returnsThis();
        sioStub.to.returnsThis();
        socket = socketStub as unknown as Socket;
        sio = sioStub as unknown as Server;
    });

    afterEach(() => {
        socketStub.on.reset();
        socketStub.emit.reset();
        socketStub.broadcast.emit.reset();
        socketStub.broadcast.to.reset();
        socketStub.to.reset();
        socketStub.join.reset();
        socketStub.leave.reset();
        sioStub.on.reset();
        sioStub.to.reset();
        sioStub.emit.reset();
        sioStub.sockets.emit.reset();
    });

    it('should create a waiting room on createWaitingRoom', () => {
        const data = [1, 'room'];
        socketStub.on.withArgs('createWaitingRoom').callsArgWith(1, data);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(waitingRoomService.add.calledOnce).to.be.equal(true);
        expect(socketStub.join.calledWith(data[0].toString())).to.be.equal(true);
        expect(sioStub.sockets.emit.calledWith('createdGame', data[0])).to.be.equal(true);
    });

    it('should emit deletedFromServer on deletedFromServer', () => {
        const id = 1;
        socketStub.on.withArgs('deletedFromServer').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(sioStub.to.calledWith(id.toString())).to.be.equal(true);
        expect(sioStub.emit.calledWith('deletedFromServer')).to.be.equal(true);
    });

    it('should emit cardDeleted on deletedFromServer', () => {
        const id = 1;
        socketStub.on.withArgs('deletedFromServer').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.broadcast.emit.calledWith('cardDeleted', id)).to.be.equal(true);
    });

    it('should emit cardDeleted, deletedFromServer and numberGamesChanged on deletedEverythingFromServer', () => {
        socketStub.on.withArgs('deletedEverythingFromServer').callsArgWith(1);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.broadcast.emit.calledWith('deletedFromServer')).to.be.equal(true);
        expect(sioStub.sockets.emit.calledWith('cardDeleted')).to.be.equal(true);
        expect(sioStub.sockets.emit.calledWith('numberGamesChanged')).to.be.equal(true);
    });

    it('should leave room on deleteWaitingRoom', () => {
        const id = 1;
        socketStub.on.withArgs('deleteWaitingRoom').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.leave.calledWith(id.toString())).to.be.equal(true);
    });

    it('should emit deletedWaitingRoom on deleteWaitingRoom', () => {
        const id = 1;
        socketStub.on.withArgs('deleteWaitingRoom').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.leave.calledWith(id.toString())).to.be.equal(true);
        expect(waitingRoomService.deleteWaitingRoom.calledWith(id - 1)).to.be.equal(true);
        expect(socketStub.broadcast.to.calledWith(id.toString())).to.be.equal(true);
        expect(socketStub.broadcast.emit.calledWith('deletedWaitingRoom', id)).to.be.equal(true);
    });

    it('should emit roomClosed on deleteWaitingRoom', () => {
        const id = 1;
        socketStub.on.withArgs('deleteWaitingRoom').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(sioStub.sockets.emit.calledWith('roomClosed', id)).to.be.equal(true);
    });

    it('should emit creatorLeft on deleteWaitingRoom', () => {
        const id = 1;
        socketStub.on.withArgs('deleteWaitingRoom').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(sioStub.sockets.emit.calledWith('creatorLeft', id)).to.be.equal(true);
    });

    it('should call removeAllUserFromId on deleteWaitingRoom', () => {
        const id = 1;
        socketStub.on.withArgs('deleteWaitingRoom').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(usernameService.removeAllUserFromId.calledWith(id)).to.be.equal(true);
    });

    it('should emit verifyUsername on verifyUsername (true)', () => {
        const usernameMessage = { id: 1, username: 'username' };
        usernameService.isUsernameAvailable.returns({ valid: true });
        socketStub.on.withArgs('verifyUsername').callsArgWith(1, usernameMessage);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(usernameService.addUsername.calledWith(usernameMessage)).to.be.equal(true);
        expect(socketStub.emit.calledWith('verifyUsername', true)).to.be.equal(true);
    });

    it('should emit verifyUsername on verifyUsername (false)', () => {
        const usernameMessage = { id: 1, username: 'username' };
        usernameService.isUsernameAvailable.returns({ valid: false });
        socketStub.on.withArgs('verifyUsername').callsArgWith(1, usernameMessage);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(usernameService.addUsername.calledWith(usernameMessage)).to.be.equal(false);
        expect(socketStub.emit.calledWith('verifyUsername', false)).to.be.equal(true);
    });

    it('should emit isCardCreating on isCardCreating (true)', () => {
        const id = 1;
        waitingRoomService.isWaitingRoom.returns(true);
        socketStub.on.withArgs('isCardCreating').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('isCardCreating', [true, id])).to.be.equal(true);
    });

    it('should emit rejected on rejected', () => {
        const id = 1;
        const waitingRoom = { waitingLine: [{ socketId: 'socketId', userName: 'userName' }] } as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('rejected').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.to.calledWith('socketId')).to.be.equal(true);
        expect(socketStub.emit.calledWith('rejected', id)).to.be.equal(true);
    });

    it('should emit emptyLine on rejected', () => {
        const id = 1;
        const waitingRoom = { waitingLine: [{ socketId: 'socketId', userName: 'userName' }] } as unknown as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('rejected').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('emptyLine', id)).to.be.equal(true);
    });

    it('should emit nextOpponent on rejected', () => {
        const id = 1;
        const waitingRoom = {
            waitingLine: [
                { socketId: 'socketId', userName: 'userName' },
                { socketId: 'socketId2', userName: 'userName2' },
            ],
        } as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('rejected').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('nextOpponent', waitingRoom.waitingLine[0])).to.be.equal(true);
    });

    it('should emit accepted on accepted', () => {
        const data = ['mode', 1, 'username'];
        const waitingRoom = {
            waitingLine: [
                { socketId: 'socketId', userName: 'userName' },
                { socketId: 'socketId2', userName: 'userName2' },
            ],
        } as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.createNewGameRoom.returns('1');
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('accepted').callsArgWith(1, data);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('accepted', 'mode/multiPlayer/0/1/username')).to.be.equal(true);
    });

    it('should emit deletedWaitingRoom on accepted', () => {
        const data = ['mode', 1, 'username'];
        const waitingRoom = {
            waitingLine: [
                { socketId: 'socketId', userName: 'userName' },
                { socketId: 'socketId2', userName: 'userName2' },
            ],
        } as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.createNewGameRoom.returns('1');
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('accepted').callsArgWith(1, data);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(sioStub.sockets.emit.calledWith('deletedWaitingRoom', 1)).to.be.equal(true);
    });

    it('should emit roomClosed on accepted', () => {
        const data = ['mode', 1, 'username'];
        const waitingRoom = {
            waitingLine: [
                { socketId: 'socketId', userName: 'userName' },
                { socketId: 'socketId2', userName: 'userName2' },
            ],
        } as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.createNewGameRoom.returns('1');
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('accepted').callsArgWith(1, data);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(sioStub.sockets.emit.calledWith('roomClosed', 1)).to.be.equal(true);
    });

    it('should emit emptyLine on quitLine', () => {
        const id = 1;
        const waitingRoom = { waitingLine: [{ socketId: 'socketId', userName: 'userName' }], creatorId: 'creator' } as unknown as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        waitingRoomService.isUserInWaitingLine.returns({ position: 0 } as unknown as IsUserPosition);
        socketStub.on.withArgs('quitLine').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('emptyLine', id)).to.be.equal(true);
    });

    it('should emit nextOpponent on quitLine', () => {
        const id = 1;
        const waitingRoom = {
            waitingLine: [
                { socketId: 'socketId', userName: 'userName' },
                { socketId: 'socketId2', userName: 'userName2' },
            ],
            creatorId: 'creator',
        } as unknown as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        waitingRoomService.isUserInWaitingLine.returns({ position: 0 } as unknown as IsUserPosition);
        socketStub.on.withArgs('quitLine').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('nextOpponent', waitingRoom.waitingLine[0])).to.be.equal(true);
    });

    it('should not emit anything on quitLine if user is not in waiting line', () => {
        const id = 1;
        const waitingRoom = {
            waitingLine: [
                { socketId: 'socketId', userName: 'userName' },
                { socketId: 'socketId2', userName: 'userName2' },
                { socketId: 'socketId3', userName: 'userName3' },
            ],
            creatorId: 'creator',
        } as unknown as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        waitingRoomService.isUserInWaitingLine.returns({ position: 1 } as unknown as IsUserPosition);
        socketStub.on.withArgs('quitLine').callsArgWith(1, id);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.called).to.be.equal(false);
    });

    it('should emit deletedRoom on joinWaitingRoom', () => {
        const data = [1, { socketId: 'socketId', userName: 'userName' }];
        waitingRoomService.findWaitingRoom.returns(EMPTY_INDEX);
        socketStub.on.withArgs('joinWaitingRoom').callsArgWith(1, data);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('deletedRoom', 1)).to.be.equal(true);
    });

    it('should emit joined on joinWaitingRoom', () => {
        const data = [1, { socketId: 'socketId', userName: 'userName' }];
        const waitingRoom = {
            waitingLine: [],
            creatorId: 'creator',
        } as unknown as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('joinWaitingRoom').callsArgWith(1, data);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('joined')).to.be.equal(true);
    });

    it('should not emit nextOpponent on joinWaitingRoom if waiting line is not empty', () => {
        const data = [1, { socketId: 'socketId', userName: 'userName' }];
        const waitingRoom = {
            waitingLine: [{ socketId: 'socketId2', userName: 'userName2' }],
            creatorId: 'creator',
        } as unknown as WaitingRoom;
        waitingRoomService.findWaitingRoom.returns(0);
        waitingRoomService.get.returns(waitingRoom);
        socketStub.on.withArgs('joinWaitingRoom').callsArgWith(1, data);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('nextOpponent')).to.be.equal(false);
    });

    it('should emit timedUsernameTaken on timedCheckUsername', () => {
        socketStub.on.withArgs('timedCheckUsername').callsArgWith(1, 'username');
        waitingRoomService.timedUsernameIsTaken.returns(true);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('timedUsernameTaken')).to.be.equal(true);
    });

    it('should emit timedUsernameAvailable on timedCheckUsername', () => {
        socketStub.on.withArgs('timedCheckUsername').callsArgWith(1, 'username');
        waitingRoomService.timedUsernameIsTaken.returns(false);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(socketStub.emit.calledWith('timedUsernameAvailable')).to.be.equal(true);
    });

    it('should emit timedGameFound on timedFindGame', () => {
        const users = [
            { socketId: 'id1', userName: 'user1' },
            { socketId: 'id2', userName: 'user2' },
        ] as UserWaiting[];
        waitingRoomService.timedFindGame.returns(users);
        waitingRoomService.timedWaitingRoomCounter = 1;
        storageService.getValidIds.resolves({ validIds: [1] });
        stub(Math, 'floor').returns(0);
        stub(Math, 'random').returns(0);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        socketStub.on
            .withArgs('timedFindGame')
            .args[0][1]('username')
            .then(() => {
                expect(sioStub.to.called).to.be.equal(true);
            });
    });

    it('should not emit timedGameFound on timedFindGame if no game is found', () => {
        waitingRoomService.timedFindGame.returns([]);
        waitingRoomService.timedWaitingRoomCounter = 1;
        storageService.getValidIds.resolves({ validIds: [1] });
        socketStub.on.withArgs('timedFindGame').callsArgWithAsync(1, 'username');
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(sioStub.to.called).to.be.equal(false);
    });

    it('should remove user from timedWaitingRoom on timedAbandon', () => {
        socketStub.on.withArgs('timedAbandon').callsArg(1);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(waitingRoomService.timedRemoveUser.calledWith(socket.id)).to.be.equal(true);
    });

    it('should emit numberGamesChanged on createdGameCard', () => {
        socketStub.on.withArgs('createdGameCard').callsArg(1);
        stub(waitingRoomHandler['gameService']);
        waitingRoomHandler.handleWaitingRoom(socket, sio);
        expect(sioStub.sockets.emit.calledWith('numberGamesChanged')).to.be.equal(true);
    });

    it('should do nothing on disconnect if user is not in waitingRoom', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: EMPTY_INDEX,
            typeOfUser: '',
            waitingLineIndex: 0,
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(waitingRoomService.deleteWaitingRoom.called).to.be.equal(false);
    });

    it('should emit deletedWaitingRoom on disconnect if user is creator', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'Creator',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: '',
            room: '',
            waitingLine: [],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(socketStub.to.calledWith('1')).to.be.equal(true);
        expect(socketStub.emit.calledWith('deletedWaitingRoom')).to.be.equal(true);
    });

    it('should emit roomClosed on disconnect if user is creator', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'Creator',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: '',
            room: '',
            waitingLine: [],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(socketStub.to.calledWith('1')).to.be.equal(true);
        expect(socketStub.emit.calledWith('roomClosed')).to.be.equal(true);
    });

    it('should emit creatorLeft on disconnect if user is creator', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'Creator',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: '',
            room: '',
            waitingLine: [],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(sioStub.sockets.emit.calledWith('creatorLeft')).to.be.equal(true);
    });

    it('should delete waitingRoom on disconnect if user is creator', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'Creator',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: '',
            room: '',
            waitingLine: [],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(waitingRoomService.deleteWaitingRoom.calledWith(0)).to.be.equal(true);
    });

    it('should remove all user from id on disconnect if user is creator', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'Creator',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: '',
            room: '',
            waitingLine: [],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(usernameService.removeAllUserFromId.calledWith(1)).to.be.equal(true);
    });

    it('should remove username on disconnect if user is not creator', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'waiting',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: '',
            room: '',
            waitingLine: [{ userName: '', socketId: '' }],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(usernameService.removeUsername.calledWith({ username: '', id: 0 })).to.be.equal(true);
    });

    it('should emit emptyLine on disconnect if user is not creator and waitingLine is empty', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'waiting',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: 'creatorId',
            room: '',
            waitingLine: [{ userName: '', socketId: '' }],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(socketStub.to.calledWith('creatorId')).to.be.equal(true);
        expect(socketStub.emit.calledWith('emptyLine')).to.be.equal(true);
    });

    it('should emit nextOpponent on disconnect if user is not creator and waitingLine is not empty', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'waiting',
            waitingLineIndex: 0,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: 'creatorId',
            room: '',
            waitingLine: [
                { userName: '', socketId: '' },
                { userName: '', socketId: '' },
            ],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(socketStub.to.calledWith('creatorId')).to.be.equal(true);
        expect(socketStub.emit.calledWith('nextOpponent')).to.be.equal(true);
    });

    it('should not emit nextOpponent on disconnect if user is not creator and waitingLine is not empty but waitingLineIndex is 1', () => {
        waitingRoomService.handleWaitingRoomDisconnection.returns({
            gameId: 0,
            typeOfUser: 'waiting',
            waitingLineIndex: 1,
        });
        waitingRoomService.get.returns({
            gameId: 0,
            creatorId: 'creatorId',
            room: '',
            waitingLine: [
                { userName: '', socketId: '' },
                { userName: '', socketId: '' },
            ],
        });
        waitingRoomHandler.disconnect(socket, sio);
        expect(socketStub.to.calledWith('creatorId')).to.be.equal(false);
        expect(socketStub.emit.calledWith('nextOpponent')).to.be.equal(false);
    });
});
