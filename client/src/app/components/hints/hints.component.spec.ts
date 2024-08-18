import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { CanvasGameService } from '@app/services/game/canvas.game.service';
import { HintService } from '@app/services/game/hint.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_CONSTANTS_NAME, GAME_STATE } from '@common/constants';
import { Subject } from 'rxjs';
import { HintsComponent } from './hints.component';

class MockStateGameService {
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
    gameConstants = [];
    gameConstantsChanged = new Subject();
    isSinglePlayer() {
        return true;
    }
}

class MockCanvasGameService {
    hint() {
        return;
    }
}

class MockHintService {
    requestId: number;
    hintsUsedChanged = new Subject<number>();
    numberOfHints = 0;
    animateX = 0;
    animateY = 0;
    middleX = 0;
    middleY = 0;
}

describe('HintsComponent', () => {
    let component: HintsComponent;
    let fixture: ComponentFixture<HintsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HintsComponent],
            providers: [
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
                {
                    provide: CanvasGameService,
                    useClass: MockCanvasGameService,
                },
                {
                    provide: HintService,
                    useClass: MockHintService,
                },
            ],
            imports: [MatIconModule, HttpClientTestingModule, RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(HintsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get hint', () => {
        const spy = spyOn(component, 'selectHint').and.returnValue();
        spyOn(component['canvasGameService'], 'hint').and.returnValue();
        component.getHint();
        expect(spy).toHaveBeenCalled();
    });

    it('should select hint 1', () => {
        component.selectHint(1);
        expect(component.hideFirst).toBe(true);
    });

    it('should select hint 1', () => {
        component.selectHint(2);
        expect(component.hideSecond).toBe(true);
    });

    it('should select hint 1', () => {
        component.selectHint(3);
        expect(component.hideThird).toBe(true);
    });

    it('ngOnInt', () => {
        component.ngAfterViewInit();
        const newValue = 2;
        component['hintService'].hintsUsedChanged.next(newValue);
        expect(component.numberHintUsed).toEqual(newValue);
    });

    it('ngAfterViewInit should subscribe to hintsUsedChanged', () => {
        component.ngAfterViewInit();
        const newValue = 2;
        component['hintService'].hintsUsedChanged.next(newValue);
        expect(component.numberHintUsed).toEqual(newValue);
    });

    it('ngAfterViewInit should subscribe to gameConstantsChanged', () => {
        component.ngAfterViewInit();
        const newValue = [{ name: GAME_CONSTANTS_NAME.PENALTY_TIME, time: 2 }];
        component['stateGameService'].gameConstants = newValue;
        component['stateGameService'].gameConstantsChanged.next(newValue);
        expect(component.penaltyTime).toEqual(2);
    });

    it('ngAfterViewInit should subscribe to gameConstantsChanged and default to 0', () => {
        component.ngAfterViewInit();
        const newValue = [{ name: GAME_CONSTANTS_NAME.PENALTY_TIME, time: 2 }];
        component['stateGameService'].gameConstantsChanged.next(newValue);
        expect(component.penaltyTime).toEqual(0);
    });
});
