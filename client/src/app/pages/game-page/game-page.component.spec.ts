import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { ReplayService } from '@app/services/replay.service';
import { Subject } from 'rxjs';
import { GamePageComponent } from './game-page.component';

@Component({
    selector: 'app-abandon-popup',
    template: '',
})
class MockAbandonPopupComponent {}

@Component({
    selector: 'app-chat',
    template: '',
})
class MockChatComponent {
    messageInput = {
        nativeElement: {},
    };
}
@Component({
    selector: 'app-end-game-popup',
    template: '',
})
class MockEndGamePopupComponent {}

@Component({
    selector: 'app-top-bar',
    template: '',
})
class MockTopBarComponent {}

@Component({
    selector: 'app-play-area',
    template: '',
})
class MockPlayAreaComponent {}

@Component({
    selector: 'app-hints',
    template: '',
})
class MockHintsComponent {}

class MockStateGameService {
    gameState = 'in-game';
    gameEnded = false;
    replayEvents = [];
    isSinglePlayer() {
        return true;
    }
}
class MockControllerGameService {
    showVideoBar: Subject<boolean> = new Subject<boolean>();
}

class MockReplayService {
    getData() {
        return;
    }
    play() {
        return;
    }
}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                GamePageComponent,
                MockAbandonPopupComponent,
                MockChatComponent,
                MockEndGamePopupComponent,
                MockTopBarComponent,
                MockPlayAreaComponent,
                MockHintsComponent,
            ],
            providers: [
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
                {
                    provide: ControllerGameService,
                    useClass: MockControllerGameService,
                },
                {
                    provide: ReplayService,
                    useClass: MockReplayService,
                },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('component should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should have a playarea', () => {
        expect(component.playArea).toBeTruthy();
    });

    it('subscribe should change values', () => {
        component.ngOnInit();
        component['controllerGameService'].showVideoBar.next(true);
        expect(component.show).toBe(true);
    });

    it('buttonDetect should call playArea.buttonDetect on window:keyup event', () => {
        const keyEvent = new KeyboardEvent('keyup');
        component.playArea = {
            buttonDetect: (event: KeyboardEvent) => {
                return event;
            },
        } as unknown as PlayAreaComponent;
        spyOn(component.playArea, 'buttonDetect').and.stub();
        component.buttonDetect(keyEvent);
        expect(component.playArea.buttonDetect).toHaveBeenCalled();
    });

    it('isSinglePlayer should return true', () => {
        spyOn(component['stateGameService'], 'isSinglePlayer').and.returnValue(true);
        expect(component.isSinglePlayer()).toBe(true);
    });

    it('isSinglePlayer should return false', () => {
        spyOn(component['stateGameService'], 'isSinglePlayer').and.returnValue(false);
        expect(component.isSinglePlayer()).toBe(false);
    });
});
