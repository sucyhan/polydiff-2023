import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StateGameService } from '@app/services/game/state.game.service';
import { StorageService } from '@app/services/storage.service';
import { CONFIGURATION_GAME_CONSTANTS, GAME_PLAYER_MODE, GAME_STATE, GAME_TIMER_MODE } from '@common/constants';
import { CallbackSignature, ChatMessage, GameConstants, GameData, PlayerData } from '@common/interfaces';
import { Subject, of } from 'rxjs';
import { environment } from 'src/environments/environment';

import { TimedWaitingPageComponent } from './timed-waiting-page.component';

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
    clientSocket = {
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

class MockStorageGameService {
    getAllValidIds = () => {
        return of({ validIds: [1, 2, 3] });
    };
}

describe('TimedWaitingPageComponent', () => {
    let component: TimedWaitingPageComponent;
    let fixture: ComponentFixture<TimedWaitingPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimedWaitingPageComponent],
            imports: [RouterTestingModule, HttpClientTestingModule, ReactiveFormsModule],
            providers: [
                FormBuilder,
                { provide: StateGameService, useClass: MockStateGameService },
                { provide: StorageService, useClass: MockStorageGameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TimedWaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('abandon should call navigate', () => {
        const spy = spyOn(component['router'], 'navigate');
        component.abandon();
        expect(spy).toHaveBeenCalled();
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

    it('verifyGamePossible should return false', () => {
        expect(component.verifyGamePossible()).toBe(false);
    });

    it('verifyGamePossible should return true', () => {
        const validIds = [1, 2, 3];
        spyOnProperty(component, 'username', 'get').and.returnValue('enrique');
        component.validIds = validIds;
        expect(component.verifyGamePossible()).toBe(true);
    });

    it('getRandomId should return good id', () => {
        const validIds = [1, 2, 3];
        spyOn(Math, 'floor').and.returnValue(0);
        component.validIds = validIds;
        expect(component.getRandomId(component.validIds)).toEqual(component.validIds[0]);
    });

    it('modeCoop should call verifyGamePossible and return true', () => {
        const spy = spyOn(component, 'verifyGamePossible').and.returnValue(true);
        component.modeCoop();
        expect(spy).toHaveBeenCalled();
    });

    it('modeCoop should call verifyGamePossible and return false', () => {
        const spy = spyOn(component, 'verifyGamePossible').and.returnValue(false);
        component.modeCoop();
        expect(spy).toHaveBeenCalled();
    });

    it('modeSolo should call verifyGamePossible and return true', () => {
        const spy = spyOn(component, 'verifyGamePossible').and.returnValue(true);
        component['storageService'].getAllValidIds = () => of({ validIds: [] });
        spyOn(component['router'], 'navigate');
        component.modeSolo();
        expect(spy).toHaveBeenCalled();
    });

    it('modeSolo should call verifyGamePossible and return false', () => {
        const spy = spyOn(component, 'verifyGamePossible').and.returnValue(false);
        spyOn(component['router'], 'navigate');
        component['storageService'].getAllValidIds = () => of({ validIds: [] });
        component.modeSolo();
        expect(spy).toHaveBeenCalled();
    });

    it('onInit should timedUsernameTaken to the socket', () => {
        spyOn(component['clientSocket'], 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'timedUsernameTaken') {
                callback([]);
            }
        });
        component.ngOnInit();
        expect(component.errorMessages.length).toBe(1);
    });

    it('onInit should timedUsernameAvailable to the socket', () => {
        component.errorMessages = ['test'];
        component.isWaiting = false;
        spyOn(component['clientSocket'], 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'timedUsernameAvailable') {
                callback([]);
            }
        });
        component.ngOnInit();
        expect(component.errorMessages.length).toBe(0);
        expect(component.isWaiting).toBe(true);
    });

    it('onInit should timedGameFound to the socket', () => {
        const spy = spyOn(component['router'], 'navigate');
        spyOn(component['clientSocket'], 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'timedGameFound') {
                callback([1, 'test', 'test']);
            }
        });
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });

    it('onInit should numberGamesChanged to the socket', () => {
        const spy = spyOn(component['storageService'], 'getAllValidIds').and.returnValue(of({ validIds: [] }));
        spyOn(component['clientSocket'], 'on').and.callFake((event: string, callback: CallbackSignature) => {
            if (event === 'numberGamesChanged') {
                callback([]);
            }
        });
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });

    it('should return an empty string if usernameInputForm is null', () => {
        component['usernameInputForm'] = { value: null } as never;
        expect(component.username).toBe('');
    });

    it('should return an empty string if usernameInputForm is null and uwu', () => {
        component['usernameInputForm'].setValue({ username: 'enrique' });
        expect(component.username).toBe('enrique');
    });
});
