import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client.service';
import { CONFIGURATION_GAME_CONSTANTS, GAME_CONSTANTS_NAME, GAME_PLAYER_MODE, GAME_STATE, GAME_TIMER_MODE, MAX_TIME, TIME } from '@common/constants';
import { Difference, GameConstants, GameData, GameEvent, PlayerData, Point } from '@common/interfaces';
import { of } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { Socket } from 'socket.io-client';
import { ChatGameService } from './chat.game.service';
import { StateGameService } from './state.game.service';
import { TimerGameService } from './timer.game.service';
import { ValidationGameService } from './validation.game.service';

class MockSocketClientService extends SocketClientService {}
class MockStateGameService {
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    timerMode: GAME_TIMER_MODE = GAME_TIMER_MODE.CLASSIC;
    timerModeChanged = new Subject<GAME_TIMER_MODE>();
    replayEvents: GameEvent[] = [];
    gameDataChanged = new Subject<GameData>();
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    currentPlayerUsername: string = '';
    currentPlayerUsernameChanged = new Subject<string>();
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
    playerMode: GAME_PLAYER_MODE = GAME_PLAYER_MODE.SINGLE_PLAYER;
    playerModeChanged = new Subject<GAME_PLAYER_MODE>();
    canMakeMove: boolean = true;
    canMakeMoveChanged = new Subject<boolean>();
    idPlayed: number[] = [];
    idPlayedChanged = new Subject<number[]>();
    gameConstants: GameConstants[] = CONFIGURATION_GAME_CONSTANTS;
    time: number = 0;
    timeChanged = new Subject<number>();
    startDate = new Date();
    endDate = new Date();
    socketClient = {
        socket: {
            emit: () => {
                return;
            },
        },
        connect: () => {
            return;
        },
        send: () => {
            return;
        },
    };
    http = {
        post: () => {
            return of(
                JSON.stringify({
                    data: {
                        id: 0,
                        title: '',
                        difficulty: '',
                        numberOfDifferences: 0,
                        differences: [],
                    },
                }),
            );
        },
        get: () => {
            return of(
                JSON.stringify({
                    data: {
                        id: 0,
                        title: '',
                        difficulty: '',
                        numberOfDifferences: 0,
                        differences: [],
                    },
                }),
            );
        },
    };
    get currentPlayer(): PlayerData {
        return this.players.find((player) => player.username === this.currentPlayerUsername) as PlayerData;
    }
    isSinglePlayer(): boolean {
        return true;
    }
    isMultiPlayer(): boolean {
        return false;
    }
}

class MockTimerGameService {
    startTimer = () => {
        return;
    };
    stopTimer = () => {
        return;
    };
}

class MockChatGameService {
    addChatMessage = () => {
        return;
    };
    setFoundDifferences = () => {
        return;
    };
    sendDifference = () => {
        return;
    };
    setErrorDifference = () => {
        return;
    };
    sendErrorMessage = () => {
        return;
    };
}

describe('ValidationGameService', () => {
    let service: ValidationGameService;
    let socketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketClientService = new MockSocketClientService();
        socketClientService.socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            providers: [
                { provide: SocketClientService, useValue: socketClientService },
                { provide: StateGameService, useClass: MockStateGameService },
                { provide: TimerGameService, useClass: MockTimerGameService },
                { provide: ChatGameService, useClass: MockChatGameService },
            ],
        });
        service = TestBed.inject(ValidationGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('validateMove should change canMakeMove to false', () => {
        spyOn(service, 'checkCoordinateIsAlreadyFound').and.returnValue(true);
        spyOn(service, 'invalidMoveMade');
        const move: Point = { x: 0, y: 0 };
        service['stateGameService'].players = [
            { username: '', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }], invalidMoves: [] },
        ];
        service['stateGameService'].canMakeMove = true;
        service.validateMove(move);
        expect(service['stateGameService'].canMakeMove).toBeFalse();
    });

    it('validateMove should check first if the coordinates are in a found difference', () => {
        const checkCoordinateIsAlreadyFoundSpy = spyOn(service, 'checkCoordinateIsAlreadyFound').and.returnValue(true);
        const invalidMoveMadeSpy = spyOn(service, 'invalidMoveMade');
        const move: Point = { x: 0, y: 0 };
        service['stateGameService'].players = [
            { username: '', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }], invalidMoves: [] },
        ];
        service.validateMove(move);
        expect(checkCoordinateIsAlreadyFoundSpy).toHaveBeenCalledWith(move);
        expect(invalidMoveMadeSpy).toHaveBeenCalled();
    });

    it('validateMove should emit validateMove if the move is valid', () => {
        const checkCoordinateIsAlreadyFoundSpy = spyOn(service, 'checkCoordinateIsAlreadyFound').and.returnValue(false);
        const socketClientSendSpy = spyOn(service['stateGameService'].socketClient, 'send');
        const move: Point = { x: 0, y: 0 };
        service['stateGameService'].players = [
            { username: '', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }], invalidMoves: [] },
        ];
        service.validateMove(move);
        expect(checkCoordinateIsAlreadyFoundSpy).toHaveBeenCalledWith(move);
        expect(socketClientSendSpy).toHaveBeenCalledWith('validateMove', [
            move,
            service['stateGameService'].players,
            service['stateGameService'].gameData,
        ]);
    });

    it('checkCoordinateIsAlreadyFound should return true', () => {
        const isPointInDifferenceSpy = spyOn(service, 'isPointInRectangle').and.returnValue(true);
        const move: Point = { x: 0, y: 0 };
        const difference: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        service['stateGameService'].players = [{ username: '', differencesFound: [difference], invalidMoves: [] }];
        expect(service.checkCoordinateIsAlreadyFound(move)).toBeTrue();
        expect(isPointInDifferenceSpy).toHaveBeenCalled();
    });

    it('checkCoordinateIsAlreadyFound should return false', () => {
        const isPointInDifferenceSpy = spyOn(service, 'isPointInRectangle').and.returnValue(false);
        const move: Point = { x: 0, y: 0 };
        const difference: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        service['stateGameService'].players = [{ username: '', differencesFound: [difference], invalidMoves: [] }];
        expect(service.checkCoordinateIsAlreadyFound(move)).toBeFalse();
        expect(isPointInDifferenceSpy).toHaveBeenCalled();
    });

    it('isPointInRectangle should return true', () => {
        const point = { x: 1, y: 1 };
        expect(service.isPointInRectangle(point, { point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } })).toBeTrue();
    });

    it('isPointInRectangle should return false', () => {
        const point = { x: 100, y: 100 };
        expect(service.isPointInRectangle(point, { point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } })).toBeFalse();
    });

    it('validMoveMade should add the difference to the player', () => {
        const difference: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.validMoveMade(difference);
        expect(service['stateGameService'].players[0].differencesFound).toEqual([difference]);
    });

    it('validMoveMade should emit updateGamePlayers if isMultiPlayer', () => {
        const difference: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service['stateGameService'].room = 'room';
        service['stateGameService'].gameData = { id: 1 } as GameData;
        spyOn(service['stateGameService'], 'isMultiPlayer').and.returnValue(true);
        const socketSpy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.validMoveMade(difference);
        expect(socketSpy).toHaveBeenCalledWith(
            'updateGamePlayers',
            service['stateGameService'].players,
            service['stateGameService'].room,
            service['stateGameService'].gameData.id,
        );
    });

    it('validMoveMade should change canMakeMove to true', () => {
        const difference: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.validMoveMade(difference);
        expect(service['stateGameService'].canMakeMove).toBeTrue();
    });

    it('validMoveMade should call loadNextTimedGame if timeModed', () => {
        const difference: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const spy = spyOn(service, 'loadNextTimedGame').and.returnValue();
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.validMoveMade(difference);
        expect(spy).toHaveBeenCalled();
    });

    it('validMoveMade should call endGameCheck after one second', fakeAsync(() => {
        const endGameCheckSpy = spyOn(service, 'endGameCheck');
        service['stateGameService'].timerMode = GAME_TIMER_MODE.CLASSIC;
        const difference: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.validMoveMade(difference);
        tick(TIME.FIVE_SECONDS);
        expect(endGameCheckSpy).toHaveBeenCalled();
    }));

    it('invalidMoveMade should add the move to the player', () => {
        const move: Point = { x: 0, y: 0 };
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.invalidMoveMade(move);
        expect(service['stateGameService'].players[0].invalidMoves).toEqual([move]);
    });

    it('invalidMoveMade should change canMakeMove to true after one second', fakeAsync(() => {
        const move: Point = { x: 0, y: 0 };
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.invalidMoveMade(move);
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].canMakeMove).toBeTrue();
    }));

    it('invalidMoveMade should call setErrorDifference and addChatMessage', () => {
        const move: Point = { x: 0, y: 0 };
        const setErrorDifferenceSpy = spyOn(service['chatGameService'], 'setErrorDifference');
        const addChatMessageSpy = spyOn(service['chatGameService'], 'addChatMessage');
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.invalidMoveMade(move);
        expect(setErrorDifferenceSpy).toHaveBeenCalled();
        expect(addChatMessageSpy).toHaveBeenCalled();
    });

    it('invalidMoveMade should call sendErrorMessage if isMultiPlayer', fakeAsync(() => {
        const move: Point = { x: 0, y: 0 };
        spyOn(service['stateGameService'], 'isMultiPlayer').and.returnValue(true);
        const sendErrorMessageSpy = spyOn(service['chatGameService'], 'sendErrorMessage');
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.invalidMoveMade(move);
        tick(TIME.ONE_SECOND);
        expect(sendErrorMessageSpy).toHaveBeenCalled();
    }));

    it('invalidMoveMade should call clearInvalidMoves after one second', fakeAsync(() => {
        const clearInvalidMovesSpy = spyOn(service, 'clearInvalidMoves');
        const move: Point = { x: 0, y: 0 };
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [] }];
        service.invalidMoveMade(move);
        tick(TIME.ONE_SECOND);
        expect(clearInvalidMovesSpy).toHaveBeenCalled();
    }));

    it('clearInvalidMoves should clear the invalid moves', () => {
        service['stateGameService'].players = [{ username: '', differencesFound: [], invalidMoves: [{ x: 0, y: 0 }] }];
        service.clearInvalidMoves();
        expect(service['stateGameService'].players[0].invalidMoves).toEqual([]);
    });

    it('endGameCheck should check for all players if 1 player has a majority of differences and is the currentPlayer', () => {
        service['stateGameService'].gameState = GAME_STATE.IN_GAME;
        service['stateGameService'].players = [
            { username: '1', differencesFound: [{ rectangles: [] }, { rectangles: [] }], invalidMoves: [] },
            { username: '2', differencesFound: [], invalidMoves: [] },
        ];
        service['stateGameService'].timerMode = GAME_TIMER_MODE.CLASSIC;
        service['stateGameService'].gameData = { numberOfDifferences: 3 } as GameData;
        service['stateGameService'].currentPlayerUsername = '1';
        service.endGameCheck();
        expect(service['stateGameService'].gameState).toEqual(GAME_STATE.WON_GAME);
    });

    it('endGameCheck should check for all players if 1 player has a majority of differences and is not the currentPlayer', () => {
        service['stateGameService'].gameState = GAME_STATE.IN_GAME;
        service['stateGameService'].players = [
            { username: '1', differencesFound: [{ rectangles: [] }, { rectangles: [] }], invalidMoves: [] },
            { username: '2', differencesFound: [], invalidMoves: [] },
        ];
        service['stateGameService'].timerMode = GAME_TIMER_MODE.CLASSIC;
        service['stateGameService'].gameData = { numberOfDifferences: 3 } as GameData;
        service['stateGameService'].currentPlayerUsername = '2';
        service.endGameCheck();
        expect(service['stateGameService'].gameState).toEqual(GAME_STATE.LOST_GAME);
    });

    it('should set the game data on the state game service', () => {
        const gameData: GameData = { numberOfDifferences: 3 } as GameData;
        spyOn(service['stateGameService'].http, 'post').and.returnValue(of(JSON.stringify(gameData)));
        spyOn(service['stateGameService'].gameDataChanged, 'next');
        service.getGameData();
        expect(service['stateGameService'].http.post).toHaveBeenCalled();
        expect(service['stateGameService'].gameData).toEqual(gameData);
        expect(service['stateGameService'].gameDataChanged.next).toHaveBeenCalledWith(gameData);
    });

    it('should set game state to OUT_OF_GAMES if there are less than 2 validIds', () => {
        const validIdsMessage = { validIds: [1] };
        spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        spyOn(service['stateGameService'].gameStateChanged, 'next');
        service.loadNextTimedGame();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.OUT_OF_GAMES);
        expect(service['stateGameService'].gameStateChanged.next).toHaveBeenCalled();
    });

    it('should set game state to PLAYED_ALL_GAMES if all validIds have been played', () => {
        const validIdsMessage = { validIds: [1, 2] };
        service['stateGameService'].idPlayed = [1, 2];
        spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        spyOn(service['stateGameService'].gameStateChanged, 'next');
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.loadNextTimedGame();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.PLAYED_ALL_GAMES);
        expect(service['stateGameService'].gameStateChanged.next).toHaveBeenCalled();
        expect(service['stateGameService'].socketClient.socket.emit).toHaveBeenCalledWith('timedGameEnded', service['stateGameService'].room);
    });

    it('should set game state to loby if not all validIds have been played in singlePlayer', () => {
        const validIdsMessage = { validIds: [1, 2, 3] };
        service['stateGameService'].idPlayed = [1, 2];
        spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        spyOn(service['stateGameService'].gameStateChanged, 'next');
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.loadNextTimedGame();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.LOBBY);
    });

    it('should set game state to loby if not all validIds have been played in Multiplayer', () => {
        const validIdsMessage = { validIds: [1, 2, 3] };
        service['stateGameService'].idPlayed = [1, 2];
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(false);
        spyOn(service['stateGameService'], 'isMultiPlayer').and.returnValue(true);
        spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        spyOn(service['stateGameService'].gameStateChanged, 'next');
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.loadNextTimedGame();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.LOBBY);
    });

    it('should set game state to loby if not all validIds have been played in SinglePlayer and max time', () => {
        const validIdsMessage = { validIds: [1, 2, 3] };
        service['stateGameService'].idPlayed = [1, 2];
        service['stateGameService'].time = MAX_TIME;
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(true);
        spyOn(service['stateGameService'], 'isMultiPlayer').and.returnValue(false);
        spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        spyOn(service['stateGameService'].gameStateChanged, 'next');
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.loadNextTimedGame();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.LOBBY);
    });

    it('should set game state to loby if not all validIds have been played in SinglePlayer and no game constant', () => {
        const validIdsMessage = { validIds: [1, 2, 3] };
        service['stateGameService'].idPlayed = [1, 2];
        service['stateGameService'].time = MAX_TIME;
        service['stateGameService'].gameConstants = [{ name: GAME_CONSTANTS_NAME.PENALTY_TIME, time: 5 }];
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(true);
        spyOn(service['stateGameService'], 'isMultiPlayer').and.returnValue(false);
        spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        spyOn(service['stateGameService'].gameStateChanged, 'next');
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.loadNextTimedGame();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.LOBBY);
    });

    it('should set game state to loby if not all validIds have been played in SinglePlayer and no game constant adn high number', () => {
        const highNumber = 12345;
        const validIdsMessage = { validIds: [1, 2, 3] };
        service['stateGameService'].idPlayed = [1, 2];
        service['stateGameService'].time = MAX_TIME;
        service['stateGameService'].gameConstants = [{ name: GAME_CONSTANTS_NAME.PENALTY_TIME, time: 5 }];
        spyOn(Math, 'floor').and.returnValue(highNumber);
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(true);
        spyOn(service['stateGameService'], 'isMultiPlayer').and.returnValue(false);
        spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        spyOn(service['stateGameService'].gameStateChanged, 'next');
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.loadNextTimedGame();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.LOBBY);
    });

    it('endgamecheck should do nothing', () => {
        service['stateGameService'].gameState = GAME_STATE.LOST_GAME;
        service.endGameCheck();
        expect(service['stateGameService'].gameState).toBe(GAME_STATE.LOST_GAME);
    });
});
