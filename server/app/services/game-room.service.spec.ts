import { CONFIGURATION_GAME_CONSTANTS, GAME_CONSTANTS_NAME, GAME_PLAYER_MODE, GAME_TIMER_MODE, MAX_TIME, TIME } from '@common/constants';
import { GameRoom, PlayerData, UserGame, UsersScore, messageScoreInfo } from '@common/interfaces';
import { expect } from 'chai';
import { SinonFakeTimers, stub, useFakeTimers } from 'sinon';
import { ConstantsService } from './constants.service';
import { GameRoomService } from './game-room.service';

describe('GameRoom Service', () => {
    let gameRoomService: GameRoomService;
    let clock: SinonFakeTimers;
    let gameRoomMock: GameRoom;
    const constantServiceMock = {
        gameConstants: CONFIGURATION_GAME_CONSTANTS,
    };

    beforeEach(async () => {
        clock = useFakeTimers({ toFake: ['setInterval'] });
        gameRoomService = new GameRoomService(constantServiceMock as ConstantsService);
        gameRoomMock = {
            id: 1,
            room: 'testRoom',
            users: [],
            players: [],
            timer: {
                time: 0,
                isActive: true,
                totalTime: 0,
                gameMode: GAME_TIMER_MODE.CLASSIC,
            },
        };
    });
    afterEach(() => {
        clock.restore();
    });

    it('should be created', () => {
        expect(gameRoomService).to.equal(gameRoomService);
    });

    it('should have an interval that increments the timer for each GameRoom that is active', async () => {
        gameRoomService.gameRooms = [gameRoomMock];
        expect(gameRoomService.gameRooms[0].timer.time).to.equal(0);
        clock.tick(TIME.ONE_SECOND);
        expect(gameRoomService.gameRooms[0].timer.time).to.equal(1);
    });

    it('should have an interval that does not increment the timer for each GameRoom that is inactive', async () => {
        gameRoomMock.timer.isActive = false;
        gameRoomService.gameRooms = [gameRoomMock];
        expect(gameRoomService.gameRooms[0].timer.time).to.equal(0);
        clock.tick(TIME.ONE_SECOND);
        expect(gameRoomService.gameRooms[0].timer.time).to.equal(0);
    });

    it('should have an interval that decrements the timer for each timedGameRoom that is active', async () => {
        gameRoomMock.timer.time = 2;
        gameRoomService.timedGameRooms = [gameRoomMock];
        expect(gameRoomService.timedGameRooms[0].timer.time).to.equal(2);
        clock.tick(TIME.ONE_SECOND);
        expect(gameRoomService.timedGameRooms[0].timer.time).to.equal(1);
    });

    it('should have an interval that does not decrement the timer for each timedGameRoom that is inactive', async () => {
        gameRoomMock.timer.isActive = false;
        gameRoomService.timedGameRooms = [gameRoomMock];
        expect(gameRoomService.timedGameRooms[0].timer.time).to.equal(0);
        clock.tick(TIME.ONE_SECOND);
        expect(gameRoomService.timedGameRooms[0].timer.time).to.equal(0);
    });

    it('getGameRoom should return a gameRoom object if it exists', async () => {
        gameRoomService.gameRooms = [gameRoomMock];
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        const gameRoom = gameRoomService.getGameRoom(1, 'testRoom', GAME_TIMER_MODE.CLASSIC);
        expect(gameRoom).to.equal(gameRoomService.gameRooms[0]);
    });

    it('getGameRoom should create a new gameRoom object if it doesnt exist', async () => {
        gameRoomService.gameRooms = [];
        stub(gameRoomService, 'findGame').returns(undefined);
        stub(gameRoomService, 'createNewRoomObject').returns(gameRoomMock);
        expect(gameRoomService.getGameRoom(1, 'testRoom', GAME_TIMER_MODE.CLASSIC)).to.equal(gameRoomMock);
        expect(gameRoomService.gameRooms.length).to.equal(1);
    });

    it('getTimedGameRoom should return a gameRoom object if it exists', async () => {
        gameRoomService.timedGameRooms = [gameRoomMock];
        stub(gameRoomService, 'findTimedGame').returns(gameRoomMock);
        const gameRoom = gameRoomService.getTimedGameRoom(1, 'testRoom');
        expect(gameRoom).to.equal(gameRoomService.timedGameRooms[0]);
    });

    it('getTimedGameRoom should create a new gameRoom object if it doesnt exist', async () => {
        gameRoomService.timedGameRooms = [];
        stub(gameRoomService, 'findTimedGame').returns(undefined);
        stub(gameRoomService, 'createNewRoomObject').returns(gameRoomMock);
        expect(gameRoomService.getTimedGameRoom(1, 'testRoom')).to.equal(gameRoomMock);
        expect(gameRoomService.timedGameRooms.length).to.equal(1);
    });

    it('findTimedGame should return a gameRoom object if it exists', async () => {
        gameRoomService.timedGameRooms = [gameRoomMock];
        const gameRoom = gameRoomService.findTimedGame('testRoom');
        expect(gameRoom).to.equal(gameRoomService.timedGameRooms[0]);
    });

    it('joinGame should return true if the user is already in the game', async () => {
        gameRoomMock.timer.isActive = false;
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'testUser' });
        gameRoomService.gameRooms = [gameRoomMock];
        expect(gameRoomService.joinGame(gameRoomService.gameRooms[0], 'testUser', 'testSocket')).to.equal(true);
    });

    it('joinGame should return false if the game is full', async () => {
        gameRoomMock.timer.isActive = false;
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'testUser' });
        gameRoomMock.users.push({ socketId: 'testSocket2', username: 'testUser2' });
        gameRoomService.gameRooms = [gameRoomMock];
        expect(gameRoomService.joinGame(gameRoomService.gameRooms[0], 'testUser5', 'testSocket5')).to.equal(false);
    });

    it('joinGame should return true if the user is not in the game and the game is not full', async () => {
        gameRoomMock.timer.isActive = false;
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'testUser' });
        gameRoomService.gameRooms = [gameRoomMock];
        expect(gameRoomService.joinGame(gameRoomService.gameRooms[0], 'testUser2', 'testSocket2')).to.equal(true);
    });

    it('updatePlayers should update the players array', async () => {
        gameRoomMock.timer.isActive = false;
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        gameRoomService.updatePlayers([{} as PlayerData], 'testRoom', 1, GAME_TIMER_MODE.CLASSIC);
        expect(gameRoomMock.players).to.deep.equal([{} as PlayerData]);
    });

    it('updatePlayers should not update the players array if the game is not found', async () => {
        stub(gameRoomService, 'findGame').returns(undefined);
        gameRoomService.updatePlayers([{} as PlayerData], 'testRoom', 1, GAME_TIMER_MODE.CLASSIC);
        expect(gameRoomService.gameRooms).to.deep.equal([]);
    });

    it('stopTimer should set the timer to inactive', async () => {
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        gameRoomService.stopTimer('testRoom', 1, GAME_TIMER_MODE.CLASSIC);
        expect(gameRoomMock.timer.isActive).to.equal(false);
    });

    it('stopTimer should not set the timer to inactive if the game is not found', async () => {
        stub(gameRoomService, 'findGame').returns(undefined);
        gameRoomService.stopTimer('testRoom', 1, GAME_TIMER_MODE.CLASSIC);
        expect(gameRoomService.gameRooms).to.deep.equal([]);
    });

    it('startTimer should set the timer to active', async () => {
        gameRoomMock.timer.isActive = false;
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        gameRoomService.startTimer('testRoom', 1, GAME_TIMER_MODE.CLASSIC);
        expect(gameRoomMock.timer.isActive).to.equal(true);
    });

    it('startTimer should not set the timer to active if the game is not found', async () => {
        stub(gameRoomService, 'findGame').returns(undefined);
        gameRoomService.startTimer('testRoom', 1, GAME_TIMER_MODE.CLASSIC);
        expect(gameRoomService.gameRooms).to.deep.equal([]);
    });

    it('startTimer should set the time to the correct constant', async () => {
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        gameRoomService.startTimer('testRoom', 1, GAME_TIMER_MODE.TIMED);
        expect(gameRoomMock.timer.time).to.equal(
            CONFIGURATION_GAME_CONSTANTS.find((constant) => constant.name === GAME_CONSTANTS_NAME.INITIAL_TIME)?.time || 0,
        );
    });

    it('startTimer should fallback to 0 if the constant is not found', async () => {
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        const constantStub = stub(constantServiceMock.gameConstants, 'find').returns(undefined);
        gameRoomService.startTimer('testRoom', 1, GAME_TIMER_MODE.TIMED);
        expect(gameRoomMock.timer.time).to.equal(0);
        expect(constantStub.calledOnce).to.equal(true);
        constantStub.restore();
    });

    it('getPlayerData should return the player data', async () => {
        gameRoomMock.players.push({} as PlayerData);
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        expect(gameRoomService.getPlayerData('testRoom', 1, GAME_TIMER_MODE.CLASSIC)).to.deep.equal([{} as PlayerData]);
    });

    it('getPlayerData should return undefined if the game is not found', async () => {
        stub(gameRoomService, 'findGame').returns(undefined);
        expect(gameRoomService.getPlayerData('testRoom', 1, GAME_TIMER_MODE.CLASSIC)).to.equal(undefined);
    });

    it('findGame should return the game (CLASSIC)', async () => {
        gameRoomService.gameRooms = [gameRoomMock];
        expect(gameRoomService.findGame(1, 'testRoom', GAME_TIMER_MODE.CLASSIC)).to.deep.equal(gameRoomMock);
    });

    it('findGame should return the game (TIMED)', async () => {
        gameRoomService.timedGameRooms = [gameRoomMock];
        expect(gameRoomService.findGame(1, 'testRoom', GAME_TIMER_MODE.TIMED)).to.deep.equal(gameRoomMock);
    });

    it('usernameToNewPlayerData should return the player data', async () => {
        expect(gameRoomService.usernameToNewPlayerData('testUser')).to.deep.equal({
            username: 'testUser',
            differencesFound: [],
            invalidMoves: [],
        });
    });

    it('createNewRoomObject should return the game room', async () => {
        stub(gameRoomService, 'createNewTimerObject').returns({
            time: 0,
            isActive: false,
            totalTime: 0,
            gameMode: GAME_TIMER_MODE.CLASSIC,
        });
        gameRoomMock.timer.isActive = false;
        expect(gameRoomService.createNewRoomObject(1, 'testRoom')).to.deep.equal(gameRoomMock);
    });

    it('createNewTimerObject should return the timer', async () => {
        expect(gameRoomService.createNewTimerObject()).to.deep.equal({
            time: 0,
            isActive: true,
            totalTime: 0,
            gameMode: GAME_TIMER_MODE.CLASSIC,
        });
    });

    it('leaveGame should remove the user from the game', async () => {
        stub(gameRoomService, 'leaveTimedGame');
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'username' } as UserGame);
        gameRoomMock.players.push({ username: 'username' } as PlayerData);
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        gameRoomService.leaveGame('testRoom', 1, 'testSocket');
        expect(gameRoomMock.users).to.deep.equal([]);
        expect(gameRoomMock.players).to.deep.equal([]);
    });

    it('leaveGame should not remove the user from the game if the game is not found', async () => {
        stub(gameRoomService, 'leaveTimedGame');
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'username' } as UserGame);
        gameRoomMock.players.push({ username: 'username' } as PlayerData);
        stub(gameRoomService, 'findGame').returns(undefined);
        gameRoomService.leaveGame('testRoom', 1, 'testSocket');
        expect(gameRoomMock.users).to.deep.equal([{ socketId: 'testSocket', username: 'username' } as UserGame]);
        expect(gameRoomMock.players).to.deep.equal([{ username: 'username' } as PlayerData]);
    });

    it('leaveGame should not remove the user from the game if the user is not found', async () => {
        stub(gameRoomService, 'leaveTimedGame');
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'username' } as UserGame);
        gameRoomMock.players.push({ username: 'username' } as PlayerData);
        stub(gameRoomService, 'findGame').returns(gameRoomMock);
        gameRoomService.leaveGame('testRoom', 1, 'testSocket2');
        expect(gameRoomMock.users).to.deep.equal([{ socketId: 'testSocket', username: 'username' } as UserGame]);
        expect(gameRoomMock.players).to.deep.equal([{ username: 'username' } as PlayerData]);
    });

    it('leaveGame should call leaveTimedGame', async () => {
        const leaveTimedGameStub = stub(gameRoomService, 'leaveTimedGame');
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'username' } as UserGame);
        gameRoomMock.players.push({ username: 'username' } as PlayerData);
        stub(gameRoomService, 'findGame').returns(undefined);
        gameRoomService.leaveGame('testRoom', 1, 'testSocket');
        expect(leaveTimedGameStub.calledOnce).to.equal(true);
    });

    it('leaveTimedGame should remove the user from the game', async () => {
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'username' } as UserGame);
        gameRoomMock.players.push({ username: 'username' } as PlayerData);
        stub(gameRoomService, 'findTimedGame').returns(gameRoomMock);
        gameRoomService.leaveTimedGame('testRoom', 'testSocket');
        expect(gameRoomMock.users).to.deep.equal([]);
        expect(gameRoomMock.players).to.deep.equal([]);
    });

    it('leaveTimedGame should not remove the user from the game if the game is not found', async () => {
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'username' } as UserGame);
        gameRoomMock.players.push({ username: 'username' } as PlayerData);
        stub(gameRoomService, 'findTimedGame').returns(undefined);
        gameRoomService.leaveTimedGame('testRoom', 'testSocket');
        expect(gameRoomMock.users).to.deep.equal([{ socketId: 'testSocket', username: 'username' } as UserGame]);
        expect(gameRoomMock.players).to.deep.equal([{ username: 'username' } as PlayerData]);
    });

    it('leaveTimedGame should not remove the user from the game if the user is not found', async () => {
        gameRoomMock.users.push({ socketId: 'testSocket', username: 'username' } as UserGame);
        gameRoomMock.players.push({ username: 'username' } as PlayerData);
        stub(gameRoomService, 'findTimedGame').returns(gameRoomMock);
        gameRoomService.leaveTimedGame('testRoom', 'testSocket2');
        expect(gameRoomMock.users).to.deep.equal([{ socketId: 'testSocket', username: 'username' } as UserGame]);
        expect(gameRoomMock.players).to.deep.equal([{ username: 'username' } as PlayerData]);
    });

    it('addBonusTime should add the bonus time to the game', async () => {
        gameRoomMock.timer.time = 0;
        stub(gameRoomService, 'findTimedGame').returns(gameRoomMock);
        gameRoomService.addBonusTime('testRoom');
        expect(gameRoomMock.timer.time).to.equal(
            CONFIGURATION_GAME_CONSTANTS.find((constant) => constant.name === GAME_CONSTANTS_NAME.DISCOVER_TIME)?.time || 0,
        );
    });

    it('addBonusTime should set the time to the maximum if the time is greater than the maximum', async () => {
        gameRoomMock.timer.time = 1000;
        stub(gameRoomService, 'findTimedGame').returns(gameRoomMock);
        gameRoomService.addBonusTime('testRoom');
        expect(gameRoomMock.timer.time).to.equal(MAX_TIME);
    });

    it('addBonusTime should not add the bonus time to the game if the game is not found', async () => {
        gameRoomMock.timer.time = 0;
        stub(gameRoomService, 'findTimedGame').returns(undefined);
        gameRoomService.addBonusTime('testRoom');
        expect(gameRoomMock.timer.time).to.equal(0);
    });

    it('addBonusTime should not add the bonus time to the game if the constant is not found', async () => {
        gameRoomMock.timer.time = 0;
        stub(gameRoomService, 'findTimedGame').returns(gameRoomMock);
        const constantStub = stub(constantServiceMock.gameConstants, 'find').returns(undefined);
        gameRoomService.addBonusTime('testRoom');
        expect(gameRoomMock.timer.time).to.equal(0);
        constantStub.restore();
    });

    it('createNewRecordMessage should create good message (solo)', () => {
        const userScore: UsersScore = { name: 'baby', time: 1 };
        const info: messageScoreInfo = { position: 1, gameName: 'Hello there', mode: GAME_PLAYER_MODE.SINGLE_PLAYER };
        expect(gameRoomService.createNewRecordMessage(userScore, info).time).equal(userScore.time);
    });
    it('createNewRecordMessage should create good message (multi)', () => {
        const userScore: UsersScore = { name: 'baby', time: 1 };
        const info: messageScoreInfo = { position: 1, gameName: 'Hello there', mode: GAME_PLAYER_MODE.MULTI_PLAYER };
        expect(gameRoomService.createNewRecordMessage(userScore, info).time).equal(userScore.time);
    });
});
