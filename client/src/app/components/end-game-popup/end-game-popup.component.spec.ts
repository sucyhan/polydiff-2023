import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { TimerGameService } from '@app/services/game/timer.game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GAME_PLAYER_MODE, GAME_STATE, USERS_SOLO_RANKING } from '@common/constants';
import { GameData, PlayerData, PrivateFunction, UsersScore } from '@common/interfaces';
import { of, Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { EndGamePopupComponent } from './end-game-popup.component';

class MockSocketClientService extends SocketClientService {
    // Needed for mocking socket.send while keeping the same signature
    // eslint-disable-next-line no-unused-vars
    override send<T>(event: string, data?: T) {
        return;
    }
    override connect(): void {
        return;
    }
}

class MockStateGameService {
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    gameDataChanged = new Subject<GameData>();
    time: number = 0;
    timeChanged = new Subject<number>();
    startDate = new Date();
    endDate = new Date();
    currentPlayerUsername: string = '';
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    idPlayed: number[] = [];
    idPlayedChanged = new Subject<number[]>();
    controllerGameService = {
        leaveGame: () => {
            return;
        },
        reloadPage: () => {
            return;
        },
    };
    timerGameService = {
        submitTime: () => {
            return of();
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

class MockControllerGameService {
    leaveGame = () => {
        return;
    };
    reloadPage = () => {
        return;
    };
    replayVideo = () => {
        return;
    };
}

class MockTimerGameService {
    submitTime = () => {
        return of();
    };
}

describe('EndGamePopupSoloComponent', () => {
    let component: EndGamePopupComponent;
    let fixture: ComponentFixture<EndGamePopupComponent>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [MatIconModule, ReactiveFormsModule, HttpClientTestingModule],
            providers: [
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
                FormBuilder,
                {
                    provide: ControllerGameService,
                    useClass: MockControllerGameService,
                },
                {
                    provide: TimerGameService,
                    useClass: MockTimerGameService,
                },
                {
                    provide: SocketClientService,
                    useValue: socketClientServiceMock,
                },
            ],
            declarations: [EndGamePopupComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EndGamePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create a new instance of FormBuilder', () => {
        expect(component['formBuilder']).toBeTruthy();
    });

    it('get username should return the username from the form', () => {
        component['usernameInputForm'].setValue({ username: 'test' });
        expect(component.username).toEqual('test');
    });

    it('ngOnInit should set new record', () => {
        const notEligiblePlacement = -1;
        const gameScores: UsersScore[] = USERS_SOLO_RANKING;
        socketHelper.peerSideEmit('newRecord', [1, GAME_PLAYER_MODE.SINGLE_PLAYER, [gameScores, notEligiblePlacement]]);
        component.ngOnInit();
        expect(component.leaderBoard[0].time).toEqual(gameScores[0].time);
    });

    it('ngOnInit should set new record and send global message', () => {
        const gameScores: UsersScore[] = USERS_SOLO_RANKING;
        socketHelper.peerSideEmit('newRecord', [1, GAME_PLAYER_MODE.SINGLE_PLAYER, [gameScores, 1]]);
        component.ngOnInit();
        expect(component.leaderBoard[0].time).toEqual(gameScores[0].time);
    });

    it('ngOnInit multiplayer', () => {
        spyOn(component, 'isSinglePlayer').and.returnValue(false);
        component.ngOnInit();
        expect(component.gamePlayerMode).toEqual(GAME_PLAYER_MODE.MULTI_PLAYER);
    });

    it('ngOnInit should set game mode', () => {
        spyOn(component, 'isClassic').and.returnValue(false);
        component.ngOnInit();
        expect(component.gameMode).toEqual('Temps limité');
    });

    it('ngOnInit should set game mode', () => {
        spyOn(component, 'isClassic').and.returnValue(true);
        component.ngOnInit();
        expect(component.gameMode).toEqual('Classique');
    });

    it('ngOnInit should set get score', () => {
        const gameScores: UsersScore[] = USERS_SOLO_RANKING;
        socketHelper.peerSideEmit('getScores', gameScores);
        component.ngOnInit();
        expect(component.leaderBoard[0].time).toEqual(gameScores[0].time);
    });

    it('should return "" when username is set to null', () => {
        component.usernameInputForm.setValue({ username: null });
        expect(component.username).toEqual('');
    });

    it('should return "" when usernameInputForm value is null', () => {
        component.usernameInputForm = FormGroup.prototype;
        expect(component.username).toEqual('');
    });

    it('leaveGame should call stateGameService.controllerGameService.leaveGame', () => {
        spyOn(component['controllerGameService'], 'leaveGame');
        component.leaveGame();
        expect(component['controllerGameService'].leaveGame).toHaveBeenCalled();
    });

    it('playAgain should call stateGameService.controllerGameService.reloadPage', () => {
        spyOn(component['controllerGameService'], 'reloadPage');
        component.playAgain();
        expect(component['controllerGameService'].reloadPage).toHaveBeenCalled();
    });

    it('sendScore should not call gameSinglePlayerService.submitTime if the username is invalid', () => {
        spyOn(component, 'verifyUsername').and.returnValue(false);
        component.submittedTimeToServer = false;
        component.showUsernameMessage = false;
        component.sendScore();
        expect(component.submittedTimeToServer).toBeFalse();
        expect(component.showUsernameMessage).toBeFalse();
    });

    it('sendScore should change usernameMessage and set submittedTimeToServer to true if response is valid', fakeAsync(() => {
        spyOn(component, 'verifyUsername').and.returnValue(true);
        spyOn(component, 'username' as never).and.returnValue('' as never);
        component['stateGameService'].players = [{ username: 'test', differencesFound: [], invalidMoves: [] }];
        component.sendScore();
        tick();
        expect(component.usernameMessage).toEqual('Temps soumis!');
        expect(component.submittedTimeToServer).toEqual(true);
    }));

    it('verifyUsername should return true if the username is longer than USERNAME_MIN_LENGTH characters', () => {
        component.usernameInputForm.setValue({ username: 'test' });
        expect(component.verifyUsername()).toEqual(true);
    });

    it('verifyUsername should return false if the username is shorter than USERNAME_MIN_LENGTH characters', () => {
        component.usernameInputForm.setValue({ username: 'te' });
        expect(component.verifyUsername()).toEqual(false);
    });

    it('verifyUsername should return false if the username is empty', () => {
        component.usernameInputForm.setValue({ username: '' });
        expect(component.verifyUsername()).toEqual(false);
    });

    it('verifyUsername should return true if the username is shorter than USERNAME_MAX_LENGTH characters', () => {
        component.usernameInputForm.setValue({ username: 'test' });
        expect(component.verifyUsername()).toEqual(true);
    });

    it('verifyUsername should return false if the username is longer than USERNAME_MAX_LENGTH characters', () => {
        component.usernameInputForm.setValue({ username: 'testtesttesttesttesttesttesttest' });
        expect(component.verifyUsername()).toEqual(false);
    });

    it('verifyKeyPress should return true if the key pressed is a letter', () => {
        expect(
            component.verifyKeyPress({
                key: 'a',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return true if the key pressed is a number', () => {
        expect(
            component.verifyKeyPress({
                key: '1',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return false if the key pressed is a space', () => {
        expect(
            component.verifyKeyPress({
                key: ' ',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeFalsy();
    });

    it('verifyKeyPress should return false if the key pressed is a special character', () => {
        expect(
            component.verifyKeyPress({
                key: '!',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeFalsy();
    });

    it('verifyKeyPress should return true if the key pressed is a backspace', () => {
        expect(
            component.verifyKeyPress({
                key: 'Backspace',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('should subscribe to time, gameData and gameState, idPlayer', () => {
        spyOn(component, 'checkIfGameIsOver');

        component.time = 0;
        component.gameData = {} as GameData;
        component.showPopup = false;
        component['stateGameService'].timeChanged.next(1);
        component['stateGameService'].gameDataChanged.next({ title: 'test' } as GameData);
        component['stateGameService'].gameStateChanged.next(GAME_STATE.WON_GAME);
        component['stateGameService'].idPlayedChanged.next([1]);

        expect(component.time).toEqual(1);
        expect(component.gameData.title).toEqual('test');
        expect(component.checkIfGameIsOver).toHaveBeenCalledWith(GAME_STATE.WON_GAME);
    });

    it('ngOnDestroy should unsubscribe from time, title and gameFinished', () => {
        spyOn(component.timeSubscription, 'unsubscribe');
        spyOn(component.gameDataSubscription, 'unsubscribe');
        spyOn(component.gameStateSubscription, 'unsubscribe');
        component.ngOnDestroy();
        expect(component.timeSubscription.unsubscribe).toHaveBeenCalled();
        expect(component.gameDataSubscription.unsubscribe).toHaveBeenCalled();
        expect(component.gameStateSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('isSinglePlayer should return this.stateGameService.isSinglePlayer()', () => {
        const isSinglePlayerSpy = spyOn(component['stateGameService'], 'isSinglePlayer');
        component.isSinglePlayer();
        expect(isSinglePlayerSpy).toHaveBeenCalled();
    });

    it('isMultiPlayer should return this.stateGameService.isMultiPlayer()', () => {
        const isMultiPlayerSpy = spyOn(component['stateGameService'], 'isMultiPlayer');
        component.isMultiPlayer();
        expect(isMultiPlayerSpy).toHaveBeenCalled();
    });

    it('checkIfGameIsOver should set showPopup, endMessage, imgSrc and winnerUsername if game is won and enter condition', () => {
        const mock = new Subject<UsersScore[]>();
        component.numberOfSends = 0;
        component.showPopup = false;
        component.endMessage = '';
        component.imgSrc = '';
        component.winnerUsername = '';
        spyOn(component, 'isMultiPlayer').and.returnValue(true);
        spyOn(component['storageService'], 'getScore').and.returnValue(mock);
        component['stateGameService'].currentPlayerUsername = 'test';
        component.checkIfGameIsOver(GAME_STATE.WON_GAME);
        mock.next([] as UsersScore[]);
        expect(component.isMultiPlayer).toHaveBeenCalled();
    });

    it('checkIfGameIsOver should set playedAllGames to true', () => {
        component.numberOfSends = 0;
        component.showPopup = false;
        component.endMessage = '';
        component.imgSrc = '';
        component.winnerUsername = '';
        component['stateGameService'].currentPlayerUsername = 'test';
        component.checkIfGameIsOver(GAME_STATE.PLAYED_ALL_GAMES);
        expect(component.playedAllGames).toBe(true);
    });

    it('checkIfGameIsOver should set showPopUp to true', () => {
        component.numberOfSends = 0;
        component.showPopup = false;
        component.endMessage = '';
        component.imgSrc = '';
        component.winnerUsername = '';
        component['stateGameService'].currentPlayerUsername = 'test';
        component.checkIfGameIsOver(GAME_STATE.NO_MORE_TIME);
        expect(component.showPopup).toBe(true);
    });

    it('checkIfGameIsOver should set showPopup, endMessage, imgSrc and winnerUsername if game is won', () => {
        component.showPopup = false;
        component.endMessage = '';
        component.imgSrc = '';
        component.winnerUsername = '';
        component['stateGameService'].currentPlayerUsername = 'test';
        component.checkIfGameIsOver(GAME_STATE.WON_GAME);
        expect(component.showPopup).toEqual(true);
        expect(component.endMessage).toEqual('Félicitations, vous avez gagné!');
        expect(component.imgSrc).toEqual('assets/winner.png');
        expect(component.winnerUsername).toEqual('test');
    });

    it('checkIfGameIsOver should set showPopup, endMessage, imgSrc and call findWinnerUsername if game is lost', () => {
        component.showPopup = false;
        component.endMessage = '';
        component.imgSrc = '';
        const findWinnerUsernameSpy = spyOn(component, 'findWinnerUsername');
        component.checkIfGameIsOver(GAME_STATE.LOST_GAME);
        expect(component.showPopup).toEqual(true);
        expect(component.endMessage).toEqual('Malheureusement, vous avez perdu...');
        expect(component.imgSrc).toEqual('assets/sad-pepe.png');
        expect(findWinnerUsernameSpy).toHaveBeenCalled();
    });

    it('checkIfGameIsOver should set showPopup, endMessage, imgSrc and call findWinnerUsername if there are no more games', () => {
        component.showPopup = false;
        component.endMessage = '';
        component.imgSrc = '';
        component.checkIfGameIsOver(GAME_STATE.OUT_OF_GAMES);
        expect(component.showPopup).toEqual(true);
        expect(component.endMessage).toEqual("Il n'y a plus de jeux disponibles!");
        expect(component.imgSrc).toEqual('assets/sad-pepe.png');
    });

    it('checkIfGameIsOver should set showPopup, endMessage, imgSrc and call findWinnerUsername if the opponent left', () => {
        component.showPopup = false;
        component.endMessage = '';
        component.imgSrc = '';
        component['stateGameService'].currentPlayerUsername = 'test';
        component.checkIfGameIsOver(GAME_STATE.OPPONENT_DISCONNECTED);
        expect(component.showPopup).toEqual(true);
        expect(component.endMessage).toEqual("Votre adversaire s'est déconnecté!");
        expect(component.imgSrc).toEqual('assets/winner.png');
        expect(component.winnerUsername).toEqual('test');
    });

    it('checkIfGameIsOver should set showPopup, endMessage, imgSrc and call findWinnerUsername if the opponent left and enter condition', () => {
        const mock = new Subject<UsersScore[]>();
        component.leaderBoard = [{ name: 'test', time: 0 }];
        spyOn(component['storageService'], 'getScore').and.returnValue(mock);
        component['stateGameService'].currentPlayerUsername = 'test';
        component.checkIfGameIsOver(GAME_STATE.OPPONENT_DISCONNECTED);
        mock.next([] as UsersScore[]);
        expect(component.leaderBoard).toEqual([] as UsersScore[]);
    });

    it('findWinnerUsername should find the other player username', () => {
        component.winnerUsername = '';
        component['stateGameService'].currentPlayerUsername = 'test';
        component['stateGameService'].players = [
            { username: 'test', differencesFound: [], invalidMoves: [] },
            { username: 'test2', differencesFound: [], invalidMoves: [] },
        ];
        component.findWinnerUsername();
        expect(component.winnerUsername).toEqual('test2');
    });

    it('findSecondPlayer should find the other player username', () => {
        component.secondPlayer = '';
        component['stateGameService'].currentPlayerUsername = 'test';
        component['stateGameService'].players = [
            { username: 'test', differencesFound: [], invalidMoves: [] },
            { username: 'test2', differencesFound: [], invalidMoves: [] },
        ];
        component.findSecondPlayer();
        expect(component.secondPlayer).toEqual('test2');
    });

    it('updateHistory should send historyData with classic single player', () => {
        const sendSpy = spyOn(component.socketSender, 'send').and.returnValue();
        const getDateSpy = spyOn<PrivateFunction>(component, 'formatDate').and.returnValue('date');
        component.gameMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        component.updateHistory();
        expect(sendSpy).toHaveBeenCalled();
        expect(getDateSpy).toHaveBeenCalled();
    });

    it('updateHistory should send historyData with classic multi player', () => {
        const sendSpy = spyOn(component.socketSender, 'send').and.returnValue();
        const getDateSpy = spyOn<PrivateFunction>(component, 'formatDate').and.returnValue('date');
        spyOn(component, 'isClassic').and.returnValue(true);
        spyOn(component, 'isSinglePlayer').and.returnValue(false);
        component.gamePlayerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        component.updateHistory();
        expect(sendSpy).toHaveBeenCalled();
        expect(getDateSpy).toHaveBeenCalled();
    });

    it('updateHistory should send historyData with limited time solo', () => {
        const sendSpy = spyOn(component.socketSender, 'send').and.returnValue();
        const getDateSpy = spyOn<PrivateFunction>(component, 'formatDate').and.returnValue('date');
        spyOn(component, 'isClassic').and.returnValue(false);
        component['stateGameService'].players = [{ username: 'user', differencesFound: [], invalidMoves: [] }];
        component.updateHistory();
        expect(sendSpy).toHaveBeenCalled();
        expect(getDateSpy).toHaveBeenCalled();
    });

    it('updateHistory should send historyData with limited time multiplayer', () => {
        const sendSpy = spyOn(component.socketSender, 'send').and.returnValue();
        const getDateSpy = spyOn<PrivateFunction>(component, 'formatDate').and.returnValue('date');
        spyOn(component, 'isClassic').and.returnValue(false);
        spyOn(component, 'isMultiPlayer').and.returnValue(true);
        component['stateGameService'].players = [
            { username: 'user1', differencesFound: [], invalidMoves: [] },
            { username: 'user2', differencesFound: [], invalidMoves: [] },
        ];
        component.updateHistory();
        expect(sendSpy).toHaveBeenCalled();
        expect(getDateSpy).toHaveBeenCalled();
    });

    it('replayGame should do false', () => {
        spyOn(component, 'isSinglePlayer').and.returnValue(false);
        component.replayGame();
        expect(component.showPopup).toBe(false);
    });

    it('replayGame should do true', () => {
        spyOn(component, 'isSinglePlayer').and.returnValue(true);
        spyOn(window, 'confirm').and.returnValue(true);
        component.replayGame();
        expect(component.showPopup).toBe(false);
    });
});
