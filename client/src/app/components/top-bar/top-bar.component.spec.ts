import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_PLAYER_MODE, GAME_STATE, GAME_TIMER_MODE } from '@common/constants';
import { GameData, PlayerData } from '@common/interfaces';
import { Subject } from 'rxjs';
import { TopBarComponent } from './top-bar.component';

class MockStateGameService {
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    time: number = 0;
    timeChanged = new Subject<number>();
    playerMode: GAME_PLAYER_MODE = GAME_PLAYER_MODE.SINGLE_PLAYER;
    playerModeChanged = new Subject<GAME_PLAYER_MODE>();
    timerMode: GAME_TIMER_MODE = GAME_TIMER_MODE.CLASSIC;
    timerModeChanged = new Subject<GAME_TIMER_MODE>();
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    gameDataChanged = new Subject<GameData>();
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
    idPlayed: number[] = [];
    idPlayedChanged = new Subject<number[]>();
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

describe('TopBarComponent', () => {
    let component: TopBarComponent;
    let fixture: ComponentFixture<TopBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatIconModule],
            declarations: [TopBarComponent],
            providers: [
                ChangeDetectorRef,
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(TopBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should subscribe to playersChanged', () => {
        const expected: PlayerData[] = [{ username: 'test', differencesFound: [], invalidMoves: [] }];
        component.players = [];
        component['stateGameService'].players = expected;
        component['stateGameService'].playersChanged.next(expected);
        expect(component.players).toBe(expected);
    });

    it('ngOnInit should subscribe to timeChanged', () => {
        const expected = 2;
        component.time = 1;
        component['stateGameService'].time = expected;
        component['stateGameService'].timeChanged.next(expected);
        expect(component.time).toBe(expected);
    });

    it('ngOnInit should subscribe to idPlayed', () => {
        const expected = 2;
        component.time = 1;
        component['stateGameService'].idPlayed = [expected];
        component['stateGameService'].idPlayedChanged.next([expected]);
        expect(component.idPlayed.length).toEqual(1);
    });

    it('ngOnInit should subscribe to playerModeChanged', () => {
        const expected = GAME_PLAYER_MODE.MULTI_PLAYER;
        component.playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        component['stateGameService'].playerMode = expected;
        component['stateGameService'].playerModeChanged.next(expected);
        expect(component.playerMode).toBe(expected);
    });

    it('ngOnInit should subscribe to timerModeChanged', () => {
        const expected = GAME_TIMER_MODE.CLASSIC;
        component.timerMode = GAME_TIMER_MODE.TIMED;
        component['stateGameService'].timerMode = expected;
        component['stateGameService'].timerModeChanged.next(expected);
        expect(component.timerMode).toBe(expected);
    });

    it('ngOnInit should subscribe to gameDataChanged', () => {
        const expected: GameData = {
            id: 0,
            title: 'test',
            difficulty: 'test',
            numberOfDifferences: 0,
            differences: [],
        };
        component.gameData = {} as GameData;
        component['stateGameService'].gameData = expected;
        component['stateGameService'].gameDataChanged.next(expected);
        expect(component.gameData).toBe(expected);
    });

    it('should unsubscribe from all subscriptions on destroy', () => {
        const playersSubscriptionSpy = spyOn(component['playersSubscription'], 'unsubscribe');
        const timeSubscriptionSpy = spyOn(component['timeSubscription'], 'unsubscribe');
        const playerModeSubscriptionSpy = spyOn(component['playerModeSubscription'], 'unsubscribe');
        const timerModeSubscriptionSpy = spyOn(component['timerModeSubscription'], 'unsubscribe');
        const gameDataSubscriptionSpy = spyOn(component['gameDataSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(playersSubscriptionSpy).toHaveBeenCalled();
        expect(timeSubscriptionSpy).toHaveBeenCalled();
        expect(playerModeSubscriptionSpy).toHaveBeenCalled();
        expect(timerModeSubscriptionSpy).toHaveBeenCalled();
        expect(gameDataSubscriptionSpy).toHaveBeenCalled();
    });

    it('abandon should change the state to ABANDONING_GAME', () => {
        component.abandon();
        expect(component['stateGameService'].gameState).toBe(GAME_STATE.ABANDONING_GAME);
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

    it('ciel should return the ceiling of a number', () => {
        expect(component.ceil(2 / 3)).toBe(1);
    });

    it('isClassic should call isClassic from stateService', () => {
        const spy = spyOn(component['stateGameService'], 'isClassic').and.returnValue(true);
        component.isClassic();
        expect(spy).toHaveBeenCalled();
    });
});
