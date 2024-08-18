import { EMPTY_INDEX } from '@common/constants';
import { WaitingRoom } from '@common/interfaces';
import { expect } from 'chai';
import { SinonSpy, spy, stub } from 'sinon';
import { WaitingRoomService } from './waiting-room.service';

describe('WaitingRoom Service', () => {
    let waitingRoomService: WaitingRoomService;
    let waitingRoomServiceSpy: SinonSpy;
    const waitingRoomMock: WaitingRoom = {
        creatorId: 'id1',
        room: 'room1',
        gameId: 2,
        waitingLine: [],
    };

    beforeEach(async () => {
        waitingRoomService = new WaitingRoomService();
        waitingRoomMock.waitingLine = [];
        waitingRoomService['waitingRooms'] = [];
        waitingRoomService['waitingRooms'].push(waitingRoomMock);
    });

    it('get should return waiting room associated with roomIndex', () => {
        const room = waitingRoomService.get(0);
        expect(room).to.equal(waitingRoomMock);
    });

    it('add should push new room into waitingRooms array', () => {
        waitingRoomService.add(waitingRoomMock);
        expect(waitingRoomService['waitingRooms'][1]).to.equal(waitingRoomMock);
    });

    it('deleteWaitingRoom should remove waiting room from waitingRooms array', () => {
        waitingRoomServiceSpy = spy(waitingRoomService, 'deleteWaitingRoom');
        stub(waitingRoomService, 'findWaitingRoom').returns(0);
        waitingRoomService.deleteWaitingRoom(2);
        expect(waitingRoomServiceSpy.calledOnce).to.equal(true);
        expect(waitingRoomService['waitingRooms'].length).to.equal(0);
    });

    it('findWaitingRoom should return index of waiting room in waitingRooms array', () => {
        const index = waitingRoomService.findWaitingRoom(2);
        expect(index).to.equal(0);
    });

    it('findWaitingRoom should return -1 if waiting room is not found', () => {
        const index = waitingRoomService.findWaitingRoom(1);
        expect(index).to.equal(EMPTY_INDEX);
    });

    it('isWaitingRoom should return true if waiting room exists', () => {
        stub(waitingRoomService, 'findWaitingRoom').returns(0);
        const exists = waitingRoomService.isWaitingRoom(1);
        expect(exists).to.equal(true);
    });

    it('isWaitingRoom should return false if waiting room does not exist', () => {
        stub(waitingRoomService, 'findWaitingRoom').returns(EMPTY_INDEX);
        const exists = waitingRoomService.isWaitingRoom(1);
        expect(exists).to.equal(false);
    });

    it('handleWaitingRoomDisconnection should return {gameId: -1, typeOfUser: "None", waitingLineIndex: 0} if user is not creator or waiting', () => {
        stub(waitingRoomService, 'isUserInWaitingLine').returns({ isInLine: false, position: EMPTY_INDEX });
        const result = waitingRoomService.handleWaitingRoomDisconnection('id2');
        expect(result.gameId).to.equal(EMPTY_INDEX);
        expect(result.typeOfUser).to.equal('None');
        expect(result.waitingLineIndex).to.equal(0);
    });

    it('handleWaitingRoomDisconnection should return {gameId: 0, typeOfUser: "Creator", waitingLineIndex: 0} if user is first game creator', () => {
        stub(waitingRoomService, 'isUserInWaitingLine').returns({ isInLine: false, position: EMPTY_INDEX });
        const result = waitingRoomService.handleWaitingRoomDisconnection('id1');
        expect(result.gameId).to.equal(0);
        expect(result.typeOfUser).to.equal('Creator');
        expect(result.waitingLineIndex).to.equal(0);
    });

    it('handleWaitingRoomDisconnection should return {gameId: 1, typeOfUser: "Creator", waitingLineIndex: 0} if user is second game creator', () => {
        waitingRoomService['waitingRooms'].push({ creatorId: 'id2', room: 'room2', gameId: 1, waitingLine: [] } as WaitingRoom);
        stub(waitingRoomService, 'isUserInWaitingLine').returns({ isInLine: false, position: EMPTY_INDEX });
        const result = waitingRoomService.handleWaitingRoomDisconnection('id2');
        expect(result.gameId).to.equal(1);
        expect(result.typeOfUser).to.equal('Creator');
        expect(result.waitingLineIndex).to.equal(0);
    });

    it('handleWaitingRoomDisconnection should return {gameId: 0, typeOfUser: "Waiting", waitingLineIndex: 0} if user first in line for id2', () => {
        waitingRoomMock.waitingLine.push({ socketId: 'id2', userName: 'user2' });
        stub(waitingRoomService, 'isUserInWaitingLine').returns({ isInLine: true, position: 0 });
        const result = waitingRoomService.handleWaitingRoomDisconnection('id2');
        expect(result.gameId).to.equal(0);
        expect(result.typeOfUser).to.equal('Waiting');
        expect(result.waitingLineIndex).to.equal(0);
    });

    it('isUserInWaitingLine should return {isInline: true, position: 0} if user is first in waiting line', () => {
        waitingRoomMock.waitingLine.push({ socketId: 'id1', userName: 'user1' });
        const result = waitingRoomService.isUserInWaitingLine('id1', waitingRoomMock);
        expect(result.isInLine).to.equal(true);
        expect(result.position).to.equal(0);
    });

    it('isUserInWaitingLine should return {isInline: true, position: 1} if user is second in waiting line', () => {
        waitingRoomMock.waitingLine.push({ socketId: 'id1', userName: 'user1' });
        waitingRoomMock.waitingLine.push({ socketId: 'id2', userName: 'user2' });
        const result = waitingRoomService.isUserInWaitingLine('id2', waitingRoomMock);
        expect(result.isInLine).to.equal(true);
        expect(result.position).to.equal(1);
    });

    it('isUserInWaitingLine should return {isInline: false, position: -1} if user is not in waiting line', () => {
        const result = waitingRoomService.isUserInWaitingLine('id1', waitingRoomMock);
        expect(result.isInLine).to.equal(false);
        expect(result.position).to.equal(EMPTY_INDEX);
    });

    it('compareWaitingRoom should return true if id1 is equal to room.gameId', () => {
        const result = waitingRoomService['compareWaitingRoom'](2, waitingRoomMock);
        expect(result).to.equal(true);
    });

    it('compareWaitingRoom should return false if id1 is not equal to room.gameId', () => {
        const result = waitingRoomService['compareWaitingRoom'](1, waitingRoomMock);
        expect(result).to.equal(false);
    });

    it('createNewGameRoom should increment the currentRoom counter', () => {
        waitingRoomService.createdGameRooms = [{ id: 1, counter: 1 }];
        waitingRoomService.createNewGameRoom(1);
        expect(waitingRoomService.createdGameRooms[0].counter).to.equal(2);
    });

    it('createNewGameRoom should create a new game room if id 1 is not found in createdGameRooms', () => {
        waitingRoomService.createdGameRooms = [{ id: 2, counter: 1 }];
        waitingRoomService.createNewGameRoom(1);
        expect(waitingRoomService.createdGameRooms.length).to.equal(2);
    });

    it('timedUsernameIsTaken should return true if username is taken', () => {
        waitingRoomService.timedWaitingRoom = [{ socketId: 'id1', userName: 'user1' }];
        const result = waitingRoomService.timedUsernameIsTaken('user1');
        expect(result).to.equal(true);
    });

    it('timedUsernameIsTaken should return false if username is not taken', () => {
        waitingRoomService.timedWaitingRoom = [{ socketId: 'id1', userName: 'user1' }];
        const result = waitingRoomService.timedUsernameIsTaken('user2');
        expect(result).to.equal(false);
    });

    it('timedFindGame should return an array of 2 users if there are 2 users in the timedWaitingRoom', () => {
        waitingRoomService.timedWaitingRoom = [
            { socketId: 'id1', userName: 'user1' },
            { socketId: 'id2', userName: 'user2' },
        ];
        const result = waitingRoomService.timedFindGame('user3', 'id3');
        expect(result.length).to.equal(2);
    });

    it('timedFindGame should return an empty array if there are no users in the timedWaitingRoom', () => {
        const result = waitingRoomService.timedFindGame('user1', 'id1');
        expect(result.length).to.equal(0);
    });

    it('timedFindGame should add the user to the timedWaitingRoom if there are less than 2 users in the timedWaitingRoom', () => {
        waitingRoomService.timedWaitingRoom = [];
        waitingRoomService.timedFindGame('user2', 'id2');
        expect(waitingRoomService.timedWaitingRoom.length).to.equal(1);
    });

    it('timedRemoveUser should remove the user from the timedWaitingRoom', () => {
        waitingRoomService.timedWaitingRoom = [{ socketId: 'id1', userName: 'user1' }];
        waitingRoomService.timedRemoveUser('id1');
        expect(waitingRoomService.timedWaitingRoom.length).to.equal(0);
    });
});
