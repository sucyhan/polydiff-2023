import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_STATE } from '@common/constants';
import { Subject } from 'rxjs';

import { AbandonPopupComponent } from './abandon-popup.component';

class MockStateGameService {
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
}

class MockControllerGameService {
    abandonGame() {
        return;
    }
}

describe('AbandonPopupComponent', () => {
    let component: AbandonPopupComponent;
    let fixture: ComponentFixture<AbandonPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AbandonPopupComponent],
            providers: [
                { provide: StateGameService, useClass: MockStateGameService },
                { provide: ControllerGameService, useClass: MockControllerGameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AbandonPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('abandon() should call stateGameService.controllerGameService.abandonGame()', () => {
        const spy = spyOn(component['controllerGameService'], 'abandonGame');
        component.abandon();
        expect(spy).toHaveBeenCalled();
    });

    it('hideAbandon() should set showPopup to false', () => {
        component.showPopup = true;
        component.hideAbandon();
        expect(component.showPopup).toBe(false);
    });

    it('should show popup when game state is ABANDONING_GAME', () => {
        expect(component.showPopup).toBe(false);
        component['stateGameService'].gameState = GAME_STATE.ABANDONING_GAME;
        component['stateGameService'].gameStateChanged.next(GAME_STATE.ABANDONING_GAME);
        expect(component.showPopup).toBe(true);
    });

    it('should set the abandon message when game state is REPLAY', () => {
        component.abandonMessage = '';
        component['stateGameService'].gameState = GAME_STATE.REPLAY;
        component['stateGameService'].gameStateChanged.next(GAME_STATE.REPLAY);
        expect(component.abandonMessage).not.toBe('');
    });

    it('should unsubscribe from gameStateSubscription on destroy', () => {
        const spy = spyOn(component['gameStateSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(spy).toHaveBeenCalled();
    });
});
