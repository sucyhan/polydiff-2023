import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CONFIGURATION_GAME_CONSTANTS, GAME_CONSTANTS_NAME, GAME_STATE, TIME } from '@common/constants';
import { GameData } from '@common/interfaces';
import { of, Subject } from 'rxjs';
import { StateGameService } from './state.game.service';
import { TimerGameService } from './timer.game.service';

class MockStateGameService {
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
    time: number = 0;
    timeChanged = new Subject<number>();
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    gameDataChanged = new Subject<GameData>();
    socketClient = {
        socket: {
            emit: () => {
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
    };
    isSinglePlayer(): boolean {
        return false;
    }
    isMultiPlayer(): boolean {
        return false;
    }
    isTimed = () => {
        return false;
    };
    isClassic = () => {
        return true;
    };
}

describe('TimerGameService', () => {
    let service: TimerGameService;
    let httpMock: HttpTestingController;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [{ provide: StateGameService, useClass: MockStateGameService }],
        });
        httpMock = TestBed.inject(HttpTestingController);
        service = TestBed.inject(TimerGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(httpMock).toBeTruthy();
    });

    it('startTimer should set the interval if isSinglePlayer', fakeAsync(() => {
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => true;
        service.startTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(1);
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(2);
        clearInterval(service.soloTimerInterval);
    }));

    it('startTimer should not set the interval if not isSinglePlayer', fakeAsync(() => {
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service.startTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(0);
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(0);
        clearInterval(service.soloTimerInterval);
    }));

    it('startTimer should emit startTimer if isMultiPlayer', fakeAsync(() => {
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service['stateGameService'].isMultiPlayer = () => true;
        service['stateGameService'].isClassic = () => true;
        service['stateGameService'].room = 'room';
        service['stateGameService'].gameData = {
            id: 0,
        } as GameData;
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.startTimer();
        expect(service['stateGameService'].socketClient.socket.emit).toHaveBeenCalled();
    }));

    it('startTimer should not emit startTimer if not isMultiPlayer', fakeAsync(() => {
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service['stateGameService'].isMultiPlayer = () => false;
        service['stateGameService'].room = 'room';
        service['stateGameService'].gameData = {
            id: 0,
        } as GameData;
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.startTimer();
        expect(service['stateGameService'].socketClient.socket.emit).not.toHaveBeenCalled();
    }));

    it('stopTimer should clear the interval if isSinglePlayer', fakeAsync(() => {
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => true;
        service.startTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(1);
        service.stopTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(1);
        clearInterval(service.soloTimerInterval);
    }));

    it('stopTimer should emit stopTimer if isMultiPlayer', fakeAsync(() => {
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service['stateGameService'].isMultiPlayer = () => true;
        service['stateGameService'].room = 'room';
        service['stateGameService'].gameData = {
            id: 0,
        } as GameData;
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.stopTimer();
        expect(service['stateGameService'].socketClient.socket.emit).toHaveBeenCalledWith('stopTimer', 'room', 0);
    }));

    it('startTimer should set the interval if isSinglePlayer in timed mode', fakeAsync(() => {
        service['stateGameService'].gameConstants = CONFIGURATION_GAME_CONSTANTS;
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => true;
        service['stateGameService'].isClassic = () => false;
        service['stateGameService'].isTimed = () => true;
        service.startTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(CONFIGURATION_GAME_CONSTANTS[0].time - 1);
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(CONFIGURATION_GAME_CONSTANTS[0].time - 2);
        clearInterval(service.soloTimerInterval);
    }));

    it('startTimer should not set the interval if not isSinglePlayer in timed mode', fakeAsync(() => {
        service['stateGameService'].gameConstants = CONFIGURATION_GAME_CONSTANTS;
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service['stateGameService'].isClassic = () => false;
        service['stateGameService'].isTimed = () => true;
        service.startTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(CONFIGURATION_GAME_CONSTANTS[0].time);
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(CONFIGURATION_GAME_CONSTANTS[0].time);
        clearInterval(service.soloTimerInterval);
    }));

    it('find should give 0', fakeAsync(() => {
        service['stateGameService'].gameConstants = [
            { name: GAME_CONSTANTS_NAME.PENALTY_TIME, time: 5 },
            { name: GAME_CONSTANTS_NAME.DISCOVER_TIME, time: 5 },
        ];
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service['stateGameService'].isClassic = () => false;
        service['stateGameService'].isTimed = () => true;
        service.startTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(0);
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(0);
        clearInterval(service.soloTimerInterval);
    }));

    it('startTimer should emit startTimer if isMultiPlayer in timed mode', fakeAsync(() => {
        service['stateGameService'].gameConstants = CONFIGURATION_GAME_CONSTANTS;
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service['stateGameService'].isMultiPlayer = () => true;
        service['stateGameService'].isClassic = () => false;
        service['stateGameService'].isTimed = () => true;
        service['stateGameService'].room = 'room';
        service['stateGameService'].gameData = {
            id: 0,
        } as GameData;
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.startTimer();
        expect(service['stateGameService'].socketClient.socket.emit).toHaveBeenCalled();
    }));

    it('startTimer should not emit startTimer if not isMultiPlayer in timed mode', fakeAsync(() => {
        service['stateGameService'].gameConstants = CONFIGURATION_GAME_CONSTANTS;
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => false;
        service['stateGameService'].isMultiPlayer = () => false;
        service['stateGameService'].isClassic = () => false;
        service['stateGameService'].isTimed = () => true;
        service['stateGameService'].room = 'room';
        service['stateGameService'].gameData = {
            id: 0,
        } as GameData;
        spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.startTimer();
        expect(service['stateGameService'].socketClient.socket.emit).not.toHaveBeenCalled();
    }));

    it('stopTimer should clear the interval if isSinglePlayer in timed mode', fakeAsync(() => {
        service['stateGameService'].gameConstants = CONFIGURATION_GAME_CONSTANTS;
        service['stateGameService'].time = 0;
        service['stateGameService'].isSinglePlayer = () => true;
        service['stateGameService'].isClassic = () => false;
        service['stateGameService'].isTimed = () => true;
        service.startTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(CONFIGURATION_GAME_CONSTANTS[0].time - 1);
        service.stopTimer();
        tick(TIME.ONE_SECOND);
        expect(service['stateGameService'].time).toEqual(CONFIGURATION_GAME_CONSTANTS[0].time - 1);
        clearInterval(service.soloTimerInterval);
    }));

    it('endTimedGameCheck should set gameState to NO_MORE_TIME', () => {
        service['stateGameService'].time = 0;
        service.endTimedGameCheck();
        expect(service['stateGameService'].gameState).toEqual(GAME_STATE.NO_MORE_TIME);
    });
});
