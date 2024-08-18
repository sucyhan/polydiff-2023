import { GAME_PLAYER_MODE, GAME_TIMER_MODE, TIME } from '@common/constants';
import { ChatColor, ChatMessage, GameData, GameRankings, GameRoom, HistoryData, PlayerData, Point } from '@common/interfaces';
import { ValidMoveResponseMessage } from '@common/messages';
import { expect } from 'chai';
import { SinonFakeTimers, SinonStubbedInstance, createStubInstance, stub, useFakeTimers } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameRoomHandler } from './game-room-handler.service';
import { GameRoomService } from './game-room.service';
import { HistoryService } from './history.service';
import { ScoreSortingService } from './score-sorting.service';
import { ValidationService } from './validation.service';

describe('GameRoomHandler Service', () => {
    let gameRoomHandler: GameRoomHandler;
    let gameRoomService: SinonStubbedInstance<GameRoomService>;
    let validationService: SinonStubbedInstance<ValidationService>;
    let scoreSortingService: SinonStubbedInstance<ScoreSortingService>;
    let historyService: SinonStubbedInstance<HistoryService>;
    let clock: SinonFakeTimers;

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
        clock = useFakeTimers({ toFake: ['setInterval'] });
        gameRoomService = createStubInstance(GameRoomService);
        validationService = createStubInstance(ValidationService);
        scoreSortingService = createStubInstance(ScoreSortingService);
        historyService = createStubInstance(HistoryService);
        gameRoomHandler = new GameRoomHandler(gameRoomService, validationService, scoreSortingService, historyService);
        socketStub.broadcast.to.returnsThis();
        sioStub.to.returnsThis();
        socket = socketStub as unknown as Socket;
        sio = sioStub as unknown as Server;
    });

    afterEach(() => {
        clock.restore();
        socketStub.on.reset();
        socketStub.emit.reset();
        socketStub.broadcast.emit.reset();
        socketStub.broadcast.to.reset();
        socketStub.join.reset();
        socketStub.leave.reset();
        sioStub.on.reset();
        sioStub.to.reset();
        sioStub.emit.reset();
        sioStub.sockets.emit.reset();
    });

    it('should set an interval that calls emit for each gameRoom that is active (CLASSIC)', (done) => {
        const emitTimeStub = stub(gameRoomHandler, 'emitTime');
        const gameRoom = {
            room: 'room',
            id: 1,
            users: [],
            players: [],
            timer: { time: 0, totalTime: 0, gameMode: GAME_TIMER_MODE.CLASSIC, isActive: true },
        };
        gameRoomService.gameRooms = [gameRoom];
        gameRoomService.timedGameRooms = [];
        clock.tick(TIME.ONE_SECOND);
        expect(emitTimeStub.calledWith(gameRoom.timer.time, `${gameRoom.id}-${gameRoom.room}`)).to.be.equal(true);
        done();
    });

    it('should set an interval that does nothing if it is not active (CLASSIC)', (done) => {
        const emitTimeStub = stub(gameRoomHandler, 'emitTime');
        const gameRoom = {
            room: 'room',
            id: 1,
            users: [],
            players: [],
            timer: { time: 0, totalTime: 0, gameMode: GAME_TIMER_MODE.CLASSIC, isActive: false },
        };
        gameRoomService.gameRooms = [gameRoom];
        gameRoomService.timedGameRooms = [];
        clock.tick(TIME.ONE_SECOND);
        expect(emitTimeStub.called).to.be.equal(false);
        done();
    });

    it('should set an interval that calls emit for each timedGameRoom that is active (TIMED)', (done) => {
        const emitTimeStub = stub(gameRoomHandler, 'emitTime');
        const gameRoom = {
            room: 'room',
            id: 1,
            users: [],
            players: [],
            timer: { time: 1, totalTime: 0, gameMode: GAME_TIMER_MODE.TIMED, isActive: true },
        };
        gameRoomService.gameRooms = [];
        gameRoomService.timedGameRooms = [gameRoom];
        clock.tick(TIME.ONE_SECOND);
        expect(emitTimeStub.calledWith(gameRoom.timer.time, `timed-${gameRoom.room}`)).to.be.equal(true);
        done();
    });

    it('should set an interval that stops the game if the time is 0 (TIMED)', (done) => {
        const emitTimeStub = stub(gameRoomHandler, 'emitTime');
        const gameRoom = {
            room: 'room',
            id: 1,
            users: [],
            players: [],

            timer: { time: 0, totalTime: 0, gameMode: GAME_TIMER_MODE.TIMED, isActive: true },
        };
        gameRoomService.gameRooms = [];
        gameRoomService.timedGameRooms = [gameRoom];
        clock.tick(TIME.ONE_SECOND);
        expect(emitTimeStub.calledWith(gameRoom.timer.time, `timed-${gameRoom.room}`)).to.be.equal(true);
        expect(gameRoom.timer.isActive).to.be.equal(false);
        done();
    });

    it('should set an interval that does nothing if it is not active (TIMED)', (done) => {
        const emitTimeStub = stub(gameRoomHandler, 'emitTime');
        const gameRoom = {
            room: 'room',
            id: 1,
            users: [],
            players: [],
            timer: { time: 0, totalTime: 0, gameMode: GAME_TIMER_MODE.TIMED, isActive: false },
        };
        gameRoomService.gameRooms = [];
        gameRoomService.timedGameRooms = [gameRoom];
        clock.tick(TIME.ONE_SECOND);
        expect(emitTimeStub.called).to.be.equal(false);
        done();
    });

    it('should join a room and a game (TIMED)', () => {
        const username = 'username';
        const room = 'room';
        const id = 1;
        const mode = GAME_TIMER_MODE.TIMED;
        socketStub.on.withArgs('joinGame').callsArgWith(1, username, room, id, mode);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(socketStub.join.calledWith(`timed-${room}`)).to.be.equal(true);
        expect(gameRoomService.getTimedGameRoom.calledWith(id, room)).to.be.equal(true);
        expect(gameRoomService.joinGame.calledWith(gameRoomService.getTimedGameRoom(id, room), username, socket.id)).to.be.equal(true);
    });

    it('should join a room and a game (CLASSIC)', () => {
        const username = 'username';
        const room = 'room';
        const id = 1;
        const mode = GAME_TIMER_MODE.CLASSIC;
        socketStub.on.withArgs('joinGame').callsArgWith(1, username, room, id, mode);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(socketStub.join.calledWith(`${id}-${room}`)).to.be.equal(true);
        expect(gameRoomService.getGameRoom.calledWith(id, room, mode)).to.be.equal(true);
        expect(gameRoomService.joinGame.calledWith(gameRoomService.getGameRoom(id, room, mode), username, socket.id)).to.be.equal(true);
    });

    it('should emit newRecord on scoreEmit', () => {
        const data = [1, GAME_TIMER_MODE.CLASSIC, { name: 'name', time: 1 }, 'gameName'];
        socketStub.on.withArgs('scoreEmit').callsArgWith(1, data);
        scoreSortingService.gameExists.returns(Promise.resolve({} as GameRankings));
        scoreSortingService.updateRanking.returns(Promise.resolve([[], 0]));
        gameRoomHandler.handleGameRoom(socket, sio);
        clock.tick(1);
        expect(scoreSortingService.updateRanking.calledWith(1, GAME_TIMER_MODE.CLASSIC, { name: 'name', time: 1 })).to.be.equal(false);
    });

    it('should not emit newRecord on scoreEmit', () => {
        const data = [1, GAME_TIMER_MODE.CLASSIC, { name: 'name', time: 1 }, 'gameName'];
        socketStub.on.withArgs('scoreEmit').callsArgWith(1, data);
        scoreSortingService.gameExists.returns(Promise.resolve(undefined as never));
        gameRoomHandler.handleGameRoom(socket, sio);
        clock.tick(1);
        expect(scoreSortingService.gameExists.calledWith(1)).to.be.equal(true);
    });

    it('should emit chatMessage on scoreEmit if updateRanking returns a position that is lower then 0', async () => {
        const data = [1, GAME_TIMER_MODE.CLASSIC, { name: 'name', time: 1 }, 'gameName'];
        gameRoomService.createNewRecordMessage.returns({} as ChatMessage);
        scoreSortingService.gameExists.returns(Promise.resolve({} as GameRankings));
        scoreSortingService.updateRanking.returns(Promise.resolve([[], 1]));
        gameRoomHandler.handleGameRoom(socket, sio);
        socketStub.on
            .withArgs('scoreEmit')
            .args[0][1](data)
            .then(() => {
                expect(scoreSortingService.updateRanking.called).to.be.equal(true);
            });
    });

    it('should broadcast a message on globalMessage', () => {
        const message = { username: 'username', message: 'message', time: 1, textColor: {} as ChatColor, backgroundColor: {} as ChatColor };
        socketStub.on.withArgs('globalMessage').callsArgWith(1, message);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(socketStub.broadcast.emit.calledWith('chatMessage', message)).to.be.equal(true);
    });

    it('should leave the room on leaveGameRoom', () => {
        const room = 'room';
        const id = 1;
        const mode = GAME_TIMER_MODE.CLASSIC;
        socketStub.on.withArgs('leaveGameRoom').callsArgWith(1, room, id, mode);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(socketStub.leave.calledWith(`${id}-${room}`)).to.be.equal(true);
    });

    it('should getScores on getScores', () => {
        const id = 1;
        const mode = GAME_TIMER_MODE.CLASSIC;
        socketStub.on.withArgs('getScores').callsArgWith(1, [id, mode]);
        gameRoomHandler.handleGameRoom(socket, sio);
        clock.tick(1);
        expect(scoreSortingService.getScores.calledWith(id, mode)).to.be.equal(true);
    });

    it('should resetScores on resetGameScores', () => {
        const id = 1;
        socketStub.on.withArgs('resetGameScores').callsArgWith(id);
        gameRoomHandler.handleGameRoom(socket, sio);
        clock.tick(1);
        expect(scoreSortingService.resetGameScores.calledOnce).to.be.equal(true);
    });

    it('should resetAllGames on resetAllGames', () => {
        socketStub.on.withArgs('resetAllGames').callsArgWith(1);
        gameRoomHandler.handleGameRoom(socket, sio);
        clock.tick(1);
        expect(scoreSortingService.resetAll.calledOnce).to.be.equal(true);
    });

    it('should getAllScores on getAllScores', () => {
        const id = 1;
        socketStub.on.withArgs('getAllScores').callsArgWith(1, id);
        gameRoomHandler.handleGameRoom(socket, sio);
        clock.tick(1);
        expect(scoreSortingService.getGameScores.calledWith(id)).to.be.equal(true);
    });

    it('should updatePlayers on updateGamePlayers', () => {
        const players = [] as PlayerData[];
        const room = 'room';
        const id = 1;
        const mode = GAME_TIMER_MODE.CLASSIC;
        socketStub.on.withArgs('updateGamePlayers').callsArgWith(1, players, room, id, mode);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.updatePlayers.calledWith(players, room, id, mode)).to.be.equal(true);
        expect(sioStub.to.calledWith(`${id}-${room}`)).to.be.equal(true);
        expect(sioStub.to().emit.calledWith('updateGamePlayers', players)).to.be.equal(true);
    });

    it('should startTimer on startTimer', () => {
        const room = 'room';
        const id = 1;
        const mode = GAME_TIMER_MODE.CLASSIC;
        socketStub.on.withArgs('startTimer').callsArgWith(1, room, id, mode);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.startTimer.calledWith(room, id, mode)).to.be.equal(true);
    });

    it('should stopTimer on stopTimer', () => {
        const room = 'room';
        const id = 1;
        const mode = GAME_TIMER_MODE.CLASSIC;
        socketStub.on.withArgs('stopTimer').callsArgWith(1, room, id, mode);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.stopTimer.calledWith(room, id, mode)).to.be.equal(true);
    });

    it('should broadcast a message on chatMessage', () => {
        const message = {} as ChatMessage;
        const room = 'room';
        const id = 1;
        socketStub.on.withArgs('chatMessage').callsArgWith(1, message, room, id);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(socketStub.broadcast.to.calledWith(`${id}-${room}`)).to.be.equal(true);
        expect(socketStub.broadcast.to().emit.calledWith('chatMessage', message)).to.be.equal(true);
    });

    it('should broadcast a message on timedChatMessage', () => {
        const message = {} as ChatMessage;
        const room = 'room';
        const id = 1;
        socketStub.on.withArgs('timedChatMessage').callsArgWith(1, message, room, id);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(socketStub.broadcast.to.calledWith(`timed-${room}`)).to.be.equal(true);
        expect(socketStub.broadcast.to().emit.calledWith('chatMessage', message)).to.be.equal(true);
    });

    it('should addBonusTime on loadNextTimedGame', () => {
        const room = 'room';
        const id = 1;
        socketStub.on.withArgs('loadNextTimedGame').callsArgWith(1, room, id);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.addBonusTime.calledWith(room)).to.be.equal(true);
        expect(socketStub.broadcast.to.calledWith(`timed-${room}`)).to.be.equal(true);
        expect(socketStub.broadcast.to().emit.calledWith('loadNextTimedGame', id)).to.be.equal(true);
    });

    it('should leaveGame on leaveGame', () => {
        const room = 'room';
        const id = 1;
        socketStub.on.withArgs('leaveGame').callsArgWith(1, room, id);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.leaveGame.calledWith(room, id, socketStub.id)).to.be.equal(true);
        expect(socketStub.leave.calledWith(`${id}-${room}`)).to.be.equal(true);
        expect(socketStub.emit.calledWith('leaveGame')).to.be.equal(true);
        expect(sioStub.to.calledWith(`${id}-${room}`)).to.be.equal(true);
        expect(sioStub.to().emit.calledWith('playerLeft')).to.be.equal(true);
    });

    it('should leaveTimedGame on leaveTimedGame', () => {
        const room = 'room';
        socketStub.on.withArgs('leaveTimedGame').callsArgWith(1, room);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.leaveTimedGame.calledWith(room, socketStub.id)).to.be.equal(true);
        expect(socketStub.leave.calledWith(`timed-${room}`)).to.be.equal(true);
        expect(socketStub.emit.calledWith('leaveGame')).to.be.equal(true);
        expect(sioStub.to.calledWith(`timed-${room}`)).to.be.equal(true);
        expect(sioStub.to().emit.calledWith('playerLeft')).to.be.equal(true);
    });

    it('should validateMove on validateMove', () => {
        const data = [{}, {}, {}] as [Point, PlayerData[], GameData];
        const message = { valid: true, difference: {} } as ValidMoveResponseMessage;
        validationService.isValidMove.returns(message);
        socketStub.on.withArgs('validateMove').callsArgWith(1, data);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(validationService.isValidMove.calledWith(data[0], data[1], data[2])).to.be.equal(true);
        expect(socketStub.emit.calledWith('validMoveMade', message.difference)).to.be.equal(true);
    });

    it('should validateMove on validateMove', () => {
        const data = [{}, {}, {}] as [Point, PlayerData[], GameData];
        const message = { valid: false };
        validationService.isValidMove.returns(message);
        socketStub.on.withArgs('validateMove').callsArgWith(1, data);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(validationService.isValidMove.calledWith(data[0], data[1], data[2])).to.be.equal(true);
        expect(socketStub.emit.calledWith('invalidMoveMade', data[0])).to.be.equal(true);
    });

    it('should leaveTimedGame on timedGameEnded', () => {
        const room = 'room';
        socketStub.on.withArgs('timedGameEnded').callsArgWith(1, room);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.leaveTimedGame.calledWith(room, socketStub.id)).to.be.equal(true);
        expect(socketStub.leave.calledWith(`timed-${room}`)).to.be.equal(true);
        expect(socketStub.broadcast.to.calledWith(`timed-${room}`)).to.be.equal(true);
        expect(socketStub.broadcast.to().emit.calledWith('timedGameEnded')).to.be.equal(true);
    });

    it('should removeTimedGame on timedGameEnded', () => {
        const gameRoom = { room: 'room', players: [] } as unknown as GameRoom;
        const room = 'room';
        gameRoomService.findTimedGame.returns(gameRoom);
        gameRoomService.timedGameRooms = [gameRoom];
        socketStub.on.withArgs('timedGameEnded').callsArgWith(1, room);
        gameRoomHandler.handleGameRoom(socket, sio);
        expect(gameRoomService.timedGameRooms).to.be.deep.equal([]);
    });

    it('should emit opponentDisconnected on disconnect (CLASSIC)', () => {
        const gameRoom = { room: 'room', users: [{ socketId: socketStub.id }] } as unknown as GameRoom;
        gameRoomService.gameRooms = [gameRoom];
        gameRoomService.timedGameRooms = [];
        gameRoomHandler.disconnect(socket, sio);
        expect(sioStub.to.calledWith(socketStub.id)).to.be.equal(true);
        expect(sioStub.to().emit.calledWith('opponentDisconnected')).to.be.equal(true);
    });

    it('should not emit opponentDisconnected on disconnect if it does not find user (CLASSIC)', () => {
        const gameRoom = { room: 'room', users: [] } as unknown as GameRoom;
        gameRoomService.gameRooms = [gameRoom];
        gameRoomService.timedGameRooms = [];
        gameRoomHandler.disconnect(socket, sio);
        expect(sioStub.to.calledWith(socketStub.id)).to.be.equal(false);
        expect(sioStub.to().emit.calledWith('opponentDisconnected')).to.be.equal(false);
    });

    it('should emit opponentDisconnected on disconnect (TIMED)', () => {
        const gameRoom = { room: 'room', users: [{ socketId: socketStub.id }] } as unknown as GameRoom;
        gameRoomService.gameRooms = [];
        gameRoomService.timedGameRooms = [gameRoom];
        gameRoomHandler.disconnect(socket, sio);
        expect(sioStub.to.calledWith(socketStub.id)).to.be.equal(true);
        expect(sioStub.to().emit.calledWith('opponentDisconnected')).to.be.equal(true);
    });

    it('should not emit opponentDisconnected on disconnect if it does not find user (TIMED)', () => {
        const gameRoom = { room: 'room', users: [] } as unknown as GameRoom;
        gameRoomService.gameRooms = [];
        gameRoomService.timedGameRooms = [gameRoom];
        gameRoomHandler.disconnect(socket, sio);
        expect(sioStub.to.calledWith(socketStub.id)).to.be.equal(false);
        expect(sioStub.to().emit.calledWith('opponentDisconnected')).to.be.equal(false);
    });

    it('should emit clock on emitTime', () => {
        const time = 1;
        const room = 'room';
        gameRoomHandler.sio = sio;
        gameRoomHandler.emitTime(time, room);
        expect(sioStub.to.calledWith(room)).to.be.equal(true);
        expect(sioStub.to().emit.calledWith('clock', time)).to.be.equal(true);
    });

    it('should add GameHistory and emit update', () => {
        const testData: HistoryData = {
            date: 'date',
            duration: 0,
            mode: GAME_PLAYER_MODE.MULTI_PLAYER,
            player1: { name: 'user1', isWinner: true, isQuitter: false },
            player2: { name: 'user2', isWinner: false, isQuitter: false },
        };
        historyService.addHistory.resolves();
        historyService.getHistory.resolves([testData]);
        gameRoomHandler.handleGameRoom(socket, sio);
        socketStub.on
            .withArgs('addGameHistory')
            .args[0][1](testData)
            .then(() => {
                expect(historyService.addHistory.calledWith(testData)).to.be.equal(true);
                expect(sioStub.emit.calledWith('updateHistory', [testData])).to.be.equal(true);
            });
    });

    it('should get GameHistory and emit update', () => {
        const testData: HistoryData = {
            date: 'date',
            duration: 0,
            mode: GAME_PLAYER_MODE.MULTI_PLAYER,
            player1: { name: 'user1', isWinner: true, isQuitter: false },
            player2: { name: 'user2', isWinner: false, isQuitter: false },
        };
        historyService.getHistory.resolves([testData]);
        gameRoomHandler.handleGameRoom(socket, sio);
        socketStub.on
            .withArgs('getHistory')
            .args[0][1]()
            .then(() => {
                expect(historyService.getHistory.called).to.be.equal(true);
                expect(sioStub.emit.calledWith('updateHistory', [testData])).to.be.equal(true);
            });
    });

    it('should delete GameHistory and emit update', () => {
        const testData: HistoryData = {
            date: 'date',
            duration: 0,
            mode: GAME_PLAYER_MODE.MULTI_PLAYER,
            player1: { name: 'user1', isWinner: true, isQuitter: false },
            player2: { name: 'user2', isWinner: false, isQuitter: false },
        };
        historyService.deleteHistory.resolves();
        historyService.getHistory.resolves([testData]);
        gameRoomHandler.handleGameRoom(socket, sio);
        socketStub.on
            .withArgs('deleteHistory')
            .args[0][1]()
            .then(() => {
                expect(historyService.deleteHistory.called).to.be.equal(true);
                expect(sioStub.emit.calledWith('updateHistory', [testData])).to.be.equal(true);
            });
    });
});
