import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NavigationEnd } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CONFIGURATION_GAME_CONSTANTS, DEFAULT_PLAYER_NAME, GAME_PLAYER_MODE, GAME_STATE, GAME_TIMER_MODE } from '@common/constants';
import { CallbackSignature, ChatMessage, Difference, GameConstants, GameData, PlayerData, Point } from '@common/interfaces';
import { of, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChatGameService } from './chat.game.service';
import { ControllerGameService } from './controller.game.service';
import { StateGameService } from './state.game.service';
import { TimerGameService } from './timer.game.service';
import { ValidationGameService } from './validation.game.service';

class MockStateGameService {
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    gameDataChanged = new Subject<GameData>();
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    currentPlayerUsername: string = '';
    currentPlayerUsernameChanged = new Subject<string>();
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
    room: string = '';
    roomChanged = new Subject<string>();
    time: number = 0;
    timeChanged = new Subject<number>();
    playerMode: GAME_PLAYER_MODE = GAME_PLAYER_MODE.SINGLE_PLAYER;
    playerModeChanged = new Subject<GAME_PLAYER_MODE>();
    timerMode: GAME_TIMER_MODE = GAME_TIMER_MODE.CLASSIC;
    timerModeChanged = new Subject<GAME_TIMER_MODE>();
    chatHistory: ChatMessage[] = [];
    chatHistoryChanged = new Subject<ChatMessage[]>();
    canMakeMove: boolean = true;
    canMakeMoveChanged = new Subject<boolean>();
    idPlayed: number[] = [];
    idPlayedChanged = new Subject<number[]>();
    gameConstants: GameConstants[] = CONFIGURATION_GAME_CONSTANTS;
    gameConstantsChanged = new Subject<GameConstants[]>();
    socketClient = {
        socket: {
            emit: () => {
                return;
            },
            on: () => {
                return;
            },
        },
        connect: () => {
            return;
        },
        on: () => {
            return;
        },
        disconnect: () => {
            return;
        },
        send: () => {
            return;
        },
    };
    router = {
        url: 'test',
        navigate: () => {
            return;
        },
        navigateByUrl: async () => {
            return new Promise<boolean>((resolve) => resolve(true));
        },
        events: {
            subscribe: (next: CallbackSignature) => {
                next(new NavigationEnd(0, environment.serverUrl, environment.serverUrl));
            },
            unsubscribe: () => {
                return;
            },
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
    isSinglePlayer = () => {
        return true;
    };
    isMultiPlayer = () => {
        return false;
    };
    isTimed = () => {
        return false;
    };
    isClassic = () => {
        return true;
    };
}

class MockTimerGameService {
    startTimer = () => {
        return;
    };
    stopTimer = () => {
        return;
    };
    endTimedGameCheck = () => {
        return;
    };
}

class MockValidationGameService {
    endGameCheck = () => {
        return;
    };
    validMoveMade = () => {
        return;
    };
    invalidMoveMade = () => {
        return;
    };
}
class MockChatGameService {
    addChatMessage = () => {
        return;
    };
    setDisconnectedPlayer = () => {
        return;
    };
}

describe('ControllerGameService', () => {
    let service: ControllerGameService;
    let setUpSpy: jasmine.Spy;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                { provide: StateGameService, useClass: MockStateGameService },
                { provide: TimerGameService, useClass: MockTimerGameService },
                { provide: ValidationGameService, useClass: MockValidationGameService },
                { provide: ChatGameService, useClass: MockChatGameService },
            ],
        });
        setUpSpy = spyOn(ControllerGameService.prototype, 'setUp');
        service = TestBed.inject(ControllerGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call setUp and handleSocket on navigationEnd', () => {
        expect(setUpSpy).toHaveBeenCalled();
    });

    it('setUp should call setId with the correct part of the url', () => {
        setUpSpy.and.callThrough();
        const setIdSpy = spyOn(service, 'setId');
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service.setUp(url);
        expect(setIdSpy).toHaveBeenCalledWith('1');
    });

    it('setUp should call setId with the correct part of the url in Timed Mode singlePlayer', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setId');
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        const spy = spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service.setUp(url);
        expect(spy).toHaveBeenCalled();
    });

    it('setUp should call setId with the correct part of the url in Timed Mode multiPlayer', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setId');
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        const spy = spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service.setUp(url);
        expect(spy).toHaveBeenCalled();
    });

    it('setUp should call setPlayerMode with the correct part of the url', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setRandomIdAndLoadGame').and.returnValue();
        const setPlayerModeSpy = spyOn(service, 'setPlayerMode').and.returnValue(false);
        spyOn(service, 'setId');
        spyOn(service, 'setTimerMode');
        spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service.setUp(url);
        expect(setPlayerModeSpy).toHaveBeenCalledWith('singlePlayer');
    });

    it('setUp should call setTimerMode with the correct part of the url', () => {
        setUpSpy.and.callThrough();
        const setTimerModeSpy = spyOn(service, 'setTimerMode').and.returnValue(false);
        spyOn(service, 'setId');
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service.setUp(url);
        expect(setTimerModeSpy).toHaveBeenCalledWith('classic');
    });

    it('setUp should call setUsername with the correct part of the url if playerMode is multiplayer', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setId');
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        const setUsernameSpy = spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/multiPlayer/1/1/test';
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        service.setUp(url);
        expect(setUsernameSpy).toHaveBeenCalledWith('test');
    });

    it('setUp should call setRoom with the correct part of the url if playerMode is multiplayer', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setId');
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        spyOn(service, 'setUsername');
        const setRoomSpy = spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/multiPlayer/1/1/test';
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        service.setUp(url);
        expect(setRoomSpy).toHaveBeenCalledWith('1');
    });

    it('setUp should call set the currentPlayerUsername and players if playerMode is singlePlayer', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setId');
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        const spy = spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        service.setUp(url);
        expect(spy).toHaveBeenCalled();
    });

    it('setUp should call getGameData', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setId');
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        const getGameDataSpy = spyOn(service, 'getGameData');
        spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service.setUp(url);
        expect(getGameDataSpy).toHaveBeenCalled();
    });

    it('setUp should call updateService', () => {
        setUpSpy.and.callThrough();
        spyOn(service, 'setId');
        spyOn(service, 'setPlayerMode').and.returnValue(true);
        spyOn(service, 'setTimerMode').and.returnValue(true);
        spyOn(service, 'setUsername');
        spyOn(service, 'setRoom');
        spyOn(service, 'getGameData');
        const updateServiceSpy = spyOn(service, 'updateService');
        const url = 'classic/singlePlayer/1';
        service.setUp(url);
        expect(updateServiceSpy).toHaveBeenCalled();
    });

    it('setUsername should set the currentPlayerUsername and call currentPlayerUsernameChanged.next', () => {
        const currentPlayerUsernameChangedSpy = spyOn(service['stateGameService'].currentPlayerUsernameChanged, 'next');
        service.setUsername('test');
        expect(service['stateGameService'].currentPlayerUsername).toEqual('test');
        expect(currentPlayerUsernameChangedSpy).toHaveBeenCalledWith('test');
    });

    it('setId should set the id and call gameDataChanged.next', () => {
        const gameDataChangedSpy = spyOn(service['stateGameService'].gameDataChanged, 'next');
        service.setId('1');
        expect(service['stateGameService'].gameData.id).toEqual(1);
        expect(gameDataChangedSpy).toHaveBeenCalledWith({ id: 1, title: '', differences: [], difficulty: '', numberOfDifferences: 0 });
    });

    it('setRoom should set the room and call roomChanged.next', () => {
        const roomChangedSpy = spyOn(service['stateGameService'].roomChanged, 'next');
        service.setRoom('1');
        expect(service['stateGameService'].room).toEqual('1');
        expect(roomChangedSpy).toHaveBeenCalledWith('1');
    });

    it('replayVideo should set gameState a REPLAY', () => {
        service.replayVideo();
        expect(service['stateGameService'].gameState).toEqual(GAME_STATE.REPLAY);
    });

    it('setPlayerMode should set the playerMode and call playerModeChanged.next', () => {
        const playerModeChangedSpy = spyOn(service['stateGameService'].playerModeChanged, 'next');
        service.setPlayerMode('singlePlayer');
        expect(service['stateGameService'].playerMode).toEqual('singlePlayer');
        expect(playerModeChangedSpy).toHaveBeenCalledWith(GAME_PLAYER_MODE.SINGLE_PLAYER);
    });

    it('setPlayerMode should set the playerMode to SINGLE_PLAYER', () => {
        service.setPlayerMode('singlePlayer');
        expect(service['stateGameService'].playerMode).toEqual(GAME_PLAYER_MODE.SINGLE_PLAYER);
    });

    it('setPlayerMode should set the playerMode to MULTI_PLAYER', () => {
        service.setPlayerMode('multiPlayer');
        expect(service['stateGameService'].playerMode).toEqual(GAME_PLAYER_MODE.MULTI_PLAYER);
    });

    it('setPlayerMode should return false if the playerMode is not valid', () => {
        expect(service.setPlayerMode('test')).toBeFalsy();
    });

    it('setTimerMode should set the timerMode and call timerModeChanged.next', () => {
        spyOn(service, 'setRandomIdAndLoadGame').and.returnValue();
        const timerModeChangedSpy = spyOn(service['stateGameService'].timerModeChanged, 'next');
        service.setTimerMode('classic');
        expect(service['stateGameService'].timerMode).toEqual('classic');
        expect(timerModeChangedSpy).toHaveBeenCalledWith(GAME_TIMER_MODE.CLASSIC);
    });

    it('setTimerMode should set the timerMode to CLASSIC', () => {
        spyOn(service, 'setRandomIdAndLoadGame').and.returnValue();
        service.setTimerMode('classic');
        expect(service['stateGameService'].timerMode).toEqual(GAME_TIMER_MODE.CLASSIC);
    });

    it('setTimerMode should set the timerMode to TIMED', () => {
        spyOn(service, 'setRandomIdAndLoadGame').and.returnValue();
        service.setTimerMode('timed');
        expect(service['stateGameService'].timerMode).toEqual(GAME_TIMER_MODE.TIMED);
    });

    it('setTimerMode should set the timerMode to TIMED', () => {
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        spyOn(service, 'loadInitialTimedGame').and.returnValue();
        spyOn(service, 'setRandomIdAndLoadGame').and.returnValue();
        service.setTimerMode('timed');
        expect(service['stateGameService'].timerMode).toEqual(GAME_TIMER_MODE.TIMED);
    });

    it('setTimerMode should return false if the timerMode is not valid', () => {
        spyOn(service, 'setRandomIdAndLoadGame').and.returnValue();
        expect(service.setTimerMode('test')).toBeFalse();
    });

    it('navigate should call router.navigate with the correct url', () => {
        const navigateSpy = spyOn(service['stateGameService'].router, 'navigate');
        service.navigate('test');
        expect(navigateSpy).toHaveBeenCalledWith(['test']);
    });

    it('reloadPage should call router.navigate with the same url', fakeAsync(() => {
        const navigateSpy = spyOn(service['stateGameService'].router, 'navigate');
        const url = 'test';
        service.reloadPage();
        tick();
        expect(navigateSpy).toHaveBeenCalledWith([url]);
    }));

    it('leaveGame should call router.navigate with the correct url', fakeAsync(() => {
        const navigateSpy = spyOn(service['stateGameService'].router, 'navigate');
        service.leaveGame();
        tick();
        expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    }));

    it('leaveGame should emit the leaveGame event if multiPlayer', () => {
        const leaveGameSpy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        service['stateGameService'].room = '1';
        service.leaveGame();
        expect(leaveGameSpy).toHaveBeenCalledWith('leaveGame', '1');
    });

    it('getGameData should send a post request with the id of the service and should update itself with the data', () => {
        const gameDataChangedSpy = spyOn(service['stateGameService'].gameDataChanged, 'next');
        service.getGameData();
        expect(gameDataChangedSpy).toHaveBeenCalled();
    });

    it('handleSocket should connect to the socket', () => {
        const socketConnectSpy = spyOn(service['stateGameService'].socketClient, 'connect');
        service.handleSocket();
        expect(socketConnectSpy).toHaveBeenCalled();
    });

    it('handleSocket should timedGameEnded to the socket', () => {
        const spy = spyOn(service['timerGameService'], 'stopTimer').and.returnValue();
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'timedGameEnded') {
                callback([]);
            }
        });
        service.handleSocket();
        expect(spy).toHaveBeenCalled();
    });

    it('handleSocket should loadNextTimedGame to the socket', () => {
        const spy = spyOn(service, 'getGameData').and.returnValue();
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'loadNextTimedGame') {
                callback([1]);
            }
        });
        service.handleSocket();
        expect(spy).toHaveBeenCalled();
    });

    it('handleSocket should get constant to the socket', () => {
        const spy = spyOn(service['stateGameService'].gameConstantsChanged, 'next').and.returnValue();
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'constant') {
                callback([CONFIGURATION_GAME_CONSTANTS]);
            }
        });
        service.handleSocket();
        expect(spy).toHaveBeenCalled();
    });

    it('handleSocket should not change the constant if the game is started', () => {
        const spy = spyOn(service['stateGameService'].gameConstantsChanged, 'next').and.returnValue();
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'constant') {
                callback([CONFIGURATION_GAME_CONSTANTS]);
            }
        });
        service['stateGameService'].gameState = GAME_STATE.IN_GAME;
        service.handleSocket();
        expect(spy).not.toHaveBeenCalled();
    });

    it('handleSocket should load constant to the socket', () => {
        const spy = spyOn(service['stateGameService'].gameConstantsChanged, 'next').and.returnValue();
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'loadConstant') {
                callback([CONFIGURATION_GAME_CONSTANTS]);
            }
        });
        service.handleSocket();
        expect(spy).toHaveBeenCalled();
    });

    it('handleSocket should update players on updateGamePlayers', () => {
        const updatePlayersSpy = spyOn(service['stateGameService'].playersChanged, 'next');
        const endGameCheckSpy = spyOn(service['validationGameService'], 'endGameCheck');
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'updateGamePlayers') {
                callback([{} as PlayerData, {} as PlayerData]);
            }
        });
        service.handleSocket();
        expect(updatePlayersSpy).toHaveBeenCalledWith([{} as PlayerData, {} as PlayerData]);
        expect(endGameCheckSpy).toHaveBeenCalled();
    });

    it('handleSocket should update time on clock', () => {
        const updateTimeSpy = spyOn(service['stateGameService'].timeChanged, 'next');
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'clock') {
                callback(1);
            }
        });
        service.handleSocket();
        expect(updateTimeSpy).toHaveBeenCalledWith(1);
    });

    it('handleSocket should update time on clock in timed mode', () => {
        const updateTimeSpy = spyOn(service['stateGameService'].timeChanged, 'next');
        const spy = spyOn(service['timerGameService'], 'endTimedGameCheck');
        spyOn(service['stateGameService'], 'isTimed').and.returnValue(true);
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'clock') {
                callback(1);
            }
        });
        service.handleSocket();
        expect(updateTimeSpy).toHaveBeenCalledWith(1);
        expect(spy).toHaveBeenCalled();
    });

    it('handleSocket should call addChatMessage on chatMessage', () => {
        const addChatMessageSpy = spyOn(service['chatGameService'], 'addChatMessage');
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'chatMessage') {
                callback({} as ChatMessage);
            }
        });
        service.handleSocket();
        expect(addChatMessageSpy).toHaveBeenCalledWith({} as ChatMessage);
    });

    it('handleSocket should call stopTimer, forceWin, reset, navigate on playerLeft with same username', () => {
        const stopTimerSpy = spyOn(service['timerGameService'], 'stopTimer');
        const forceWinSpy = spyOn(service, 'forceWin');
        const resetSpy = spyOn(service, 'reset');
        const navigateSpy = spyOn(service, 'navigate');
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'playerLeft') {
                callback('test');
            }
        });
        service['stateGameService'].currentPlayerUsername = 'test';
        service.handleSocket();
        expect(stopTimerSpy).toHaveBeenCalled();
        expect(forceWinSpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith('/home');
    });

    it('handleSocket playerLeft timed mode', () => {
        const spy = spyOn(service['stateGameService'], 'isTimed').and.returnValue(true);
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'playerLeft') {
                callback('test');
            }
        });
        service['stateGameService'].currentPlayerUsername = 'test';
        service.handleSocket();
        expect(spy).toHaveBeenCalled();
    });

    it('handleSocket should call stopTimer and forceWin on opponentDisconnected', () => {
        const stopTimerSpy = spyOn(service['timerGameService'], 'stopTimer');
        const forceWinSpy = spyOn(service, 'forceWin');
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'opponentDisconnected') {
                callback(0);
            }
        });
        service.handleSocket();
        expect(stopTimerSpy).toHaveBeenCalled();
        expect(forceWinSpy).toHaveBeenCalled();
    });

    it('handleSocket opponentDisconnected timed mode', () => {
        const spy = spyOn(service['stateGameService'], 'isTimed').and.returnValue(true);
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'opponentDisconnected') {
                callback(0);
            }
        });
        service.handleSocket();
        expect(spy).toHaveBeenCalled();
    });

    it('handleSocket should call validMoveMade on validMoveMade', () => {
        const validMoveMadeSpy = spyOn(service['validationGameService'], 'validMoveMade');
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'validMoveMade') {
                callback(0);
            }
        });
        service.handleSocket();
        expect(validMoveMadeSpy).toHaveBeenCalled();
    });

    it('handleSocket should call invalidMoveMade on invalidMoveMade', () => {
        const invalidMoveMadeSpy = spyOn(service['validationGameService'], 'invalidMoveMade');
        spyOn(service['stateGameService'].socketClient, 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'invalidMoveMade') {
                callback(0);
            }
        });
        service.handleSocket();
        expect(invalidMoveMadeSpy).toHaveBeenCalled();
    });

    it('handleSocket should emit joinGame if playerMode is multiplayer', () => {
        const socketSpy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        service['stateGameService'].currentPlayerUsername = 'test';
        service['stateGameService'].room = '1';
        service['stateGameService'].gameData = { id: 1, title: '', differences: [], difficulty: '', numberOfDifferences: 0 };
        service.handleSocket();
        expect(socketSpy).toHaveBeenCalledWith('joinGame', 'test', '1', 1, 'classic');
    });

    it('updateService should call the correct methods', () => {
        const stopTimerSpy = spyOn(service['timerGameService'], 'stopTimer');
        const resetSpy = spyOn(service, 'reset');
        const getGameDataSpy = spyOn(service, 'getGameData');
        const startTimerSpy = spyOn(service['timerGameService'], 'startTimer');
        service.updateService();
        expect(stopTimerSpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalled();
        expect(getGameDataSpy).toHaveBeenCalled();
        expect(startTimerSpy).toHaveBeenCalled();
    });

    it('reset should reset the game', () => {
        service['stateGameService'].players = [{ username: 'test', differencesFound: [{} as Difference], invalidMoves: [{} as Point] } as PlayerData];
        service.reset();
        expect(service['stateGameService'].time).toEqual(0);
        expect(service['stateGameService'].chatHistory).toEqual([]);
        expect(service['stateGameService'].gameState).toEqual(GAME_STATE.IN_GAME);
        expect(service['stateGameService'].players).toEqual([{ username: 'test', differencesFound: [], invalidMoves: [] } as PlayerData]);
    });

    it('forceWin should set the game state to opponent_disconnected', () => {
        service.forceWin();
        expect(service['stateGameService'].gameState).toEqual(GAME_STATE.OPPONENT_DISCONNECTED);
    });

    it('forceWin should call findOpponentUsername', () => {
        const findOpponentUsernameSpy = spyOn(service, 'findOpponentUsername');
        service.forceWin();
        expect(findOpponentUsernameSpy).toHaveBeenCalled();
    });

    it('forceWin should push the setDisconnectedPlayer to the chat history', () => {
        spyOn(service, 'findOpponentUsername');
        spyOn(service['chatGameService'], 'setDisconnectedPlayer').and.returnValue({} as ChatMessage);
        service.forceWin();
        expect(service['stateGameService'].chatHistory).toEqual([{} as ChatMessage]);
    });

    it('findOpponentUsername should set the opponentUsername to the correct value', () => {
        service['stateGameService'].players = [{ username: 'test1' } as PlayerData, { username: 'test2' } as PlayerData];
        service['stateGameService'].currentPlayerUsername = 'test1';
        service.findOpponentUsername();
        expect(service['stateGameService'].opponentUsername).toEqual('test2');
    });

    it('abandonGame should emit leaveGame if multiPlayer and not timed', () => {
        const emitSpy = spyOn(service['stateGameService'].socketClient.socket, 'emit').and.callThrough();
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        service['stateGameService'].currentPlayerUsername = 'test';
        service['stateGameService'].room = '1';
        service['stateGameService'].gameData = { id: 1 } as GameData;
        service.abandonGame();
        expect(emitSpy).toHaveBeenCalledWith('leaveGame', '1', 1);
    });

    it('abandonGame should emit leaveGame if multiPlayer and timed', () => {
        const emitSpy = spyOn(service['stateGameService'].socketClient.socket, 'emit').and.callThrough();
        spyOn(service['stateGameService'], 'isTimed').and.returnValue(true);
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        service['stateGameService'].currentPlayerUsername = 'test';
        service['stateGameService'].room = '1';
        service['stateGameService'].gameData = { id: 1 } as GameData;
        service.abandonGame();
        expect(emitSpy).toHaveBeenCalledWith('leaveTimedGame', '1', 1);
    });

    it('abandonGame should call reset and navigate if singlePlayer', () => {
        const resetSpy = spyOn(service, 'reset');
        const navigateSpy = spyOn(service, 'navigate');
        service['stateGameService'].playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        service.abandonGame();
        expect(resetSpy).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith('/home');
    });

    it('loadInitialTimedGame should call getGameData and startTimer and update idPlayed', fakeAsync(() => {
        const spy = spyOn(service, 'getGameData').and.returnValue();
        spyOn(service['timerGameService'], 'stopTimer').and.returnValue();
        spyOn(service['timerGameService'], 'startTimer').and.returnValue();
        service.loadInitialTimedGame();
        expect(spy).toHaveBeenCalled();
    }));

    it('loadInitialTimedGame should set the players username to the current player username', () => {
        spyOn(service, 'getGameData').and.returnValue();
        spyOn(service['timerGameService'], 'stopTimer').and.returnValue();
        spyOn(service['timerGameService'], 'startTimer').and.returnValue();
        service['stateGameService'].players = [{ username: DEFAULT_PLAYER_NAME } as PlayerData, { username: 'test2' } as PlayerData];
        service['stateGameService'].currentPlayerUsername = 'test';
        service.loadInitialTimedGame();
        expect(service['stateGameService'].players[0].username).toEqual('test');
    });

    it('setRandomIdAndLoadGame should do a get request', () => {
        const validIdsMessage = { validIds: [1, 2, 3] };
        const spy = spyOn(service['stateGameService'].http, 'get').and.returnValue(of(validIdsMessage));
        service.setRandomIdAndLoadGame();
        expect(spy).toHaveBeenCalled();
    });
});
