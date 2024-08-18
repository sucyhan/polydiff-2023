import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModule } from '@app/app.module';
import { CanvasGameService } from '@app/services/game/canvas.game.service';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { MouseGameService } from '@app/services/game/mouse-handler.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, GAME_PLAYER_MODE, GAME_STATE, LAYERS } from '@common/constants';
import { GameData, Point } from '@common/interfaces';
import { Subject } from 'rxjs';
import { PlayAreaComponent } from './play-area.component';

class MockStateGameService {
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    gameDataChanged = new Subject<GameData>();
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<string>();
    router = {
        url: '',
    };
    socketClient = {
        disconnect: () => {
            return;
        },
    };
}
class MockMouseGameService {
    onMouseDown = () => {
        return;
    };
}
class MockCanvasGameService {
    originalMultiLayerDiv: ElementRef<HTMLDivElement>;
    modifiedMultiLayerDiv: ElementRef<HTMLDivElement>;
    gameData: GameData;
    setUp() {
        return;
    }
    cheatMode() {
        return;
    }
    hint() {
        return;
    }
    resetHints() {
        return;
    }

    replayReset() {
        return;
    }
}
class MockControllerGameService {
    setUp() {
        return;
    }
    abandonGame() {
        return;
    }
    handleSocket() {
        return;
    }
}

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppModule],
            declarations: [PlayAreaComponent],
            providers: [
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
                {
                    provide: MouseGameService,
                    useClass: MockMouseGameService,
                },
                {
                    provide: CanvasGameService,
                    useClass: MockCanvasGameService,
                },
                {
                    provide: ControllerGameService,
                    useClass: MockControllerGameService,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onMouseDown should not call mouseGameService.onMouseDown if isMouseInCanvas returns false', () => {
        const expectedPosition: Point = { x: 100, y: 200 };
        const mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
        } as MouseEvent;
        const isMouseInCanvasSpy = spyOn(component, 'isMouseInCanvas').and.returnValue(false);
        const spy = spyOn(component['mouseGameService'], 'onMouseDown');
        component.onMouseDown(mouseEvent);
        expect(spy).not.toHaveBeenCalled();
        expect(isMouseInCanvasSpy).toHaveBeenCalled();
    });

    it('onMouseDown should call mouseGameService.onMouseDown if isMouseInCanvas returns true', () => {
        const expectedPosition: Point = { x: 100, y: 200 };
        const mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
        } as MouseEvent;
        const isMouseInCanvasSpy = spyOn(component, 'isMouseInCanvas').and.returnValue(true);
        const eventToCanvasSpy = spyOn(component, 'eventToCanvas').and.returnValue(expectedPosition);
        const spy = spyOn(component['mouseGameService'], 'onMouseDown');
        component.onMouseDown(mouseEvent);
        expect(spy).toHaveBeenCalled();
        expect(isMouseInCanvasSpy).toHaveBeenCalled();
        expect(eventToCanvasSpy).toHaveBeenCalled();
    });

    it('should call stateGameService.controllerGameService.abandonGame when the backButton is pressed', () => {
        const spy = spyOn(component['controllerGameService'], 'abandonGame');
        const event: PopStateEvent = new PopStateEvent('test');
        component.onPopState(event);
        expect(spy).toHaveBeenCalled();
    });

    it('should not call stateGameService.controllerGameService.abandonGame when the backButton is pressed and the url is not /play', () => {
        const spy = spyOn(component['controllerGameService'], 'abandonGame');
        const event: Event = new Event('test');
        component.onPopState(event);
        expect(spy).not.toHaveBeenCalled();
    });

    it('buttonDetect should check if the key is t and call canvasGameService.cheatMode', () => {
        component['stateGameService'].gameState = GAME_STATE.IN_GAME;
        component['stateGameService'].playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        const cheatModeSpy = spyOn(component['canvasGameService'], 'cheatMode');
        const event = {
            key: 't',
        } as KeyboardEvent;
        component.buttonDetect(event);
        expect(cheatModeSpy).toHaveBeenCalled();
    });

    it('buttonDetect should check if the key is i and call canvasGameService.hint', () => {
        component['stateGameService'].gameState = GAME_STATE.IN_GAME;
        component['stateGameService'].playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        const hintSpy = spyOn(component['canvasGameService'], 'hint');
        const event = {
            key: 'i',
        } as KeyboardEvent;
        component.buttonDetect(event);
        expect(hintSpy).toHaveBeenCalled();
    });

    it('buttonDetect should check if the key is I and call canvasGameService.hint', () => {
        component['stateGameService'].gameState = GAME_STATE.IN_GAME;
        component['stateGameService'].playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        const event = {
            key: 'I',
        } as KeyboardEvent;
        const spy = spyOn(component['canvasGameService'], 'hint');
        component.buttonDetect(event);
        expect(spy).toHaveBeenCalled();
    });

    it('buttonDetect should check if the key is T and call canvasGameService.cheatMode', () => {
        component['stateGameService'].gameState = GAME_STATE.IN_GAME;
        component['stateGameService'].playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        const event = {
            key: 'T',
        } as KeyboardEvent;
        const spy = spyOn(component['canvasGameService'], 'cheatMode');
        component.buttonDetect(event);
        expect(spy).toHaveBeenCalled();
    });

    it('eventToCanvas should return the correct position', () => {
        const expectedPosition: Point = { x: 100, y: 200 };
        const mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
        } as MouseEvent;
        component.original = {
            nativeElement: {
                offsetWidth: DEFAULT_WIDTH,
                offsetHeight: DEFAULT_HEIGHT,
            },
        } as ElementRef<HTMLDivElement>;
        const result = component.eventToCanvas(mouseEvent);
        expect(result).toEqual(expectedPosition);
    });

    it('isMouseInCanvas should return true if mouse is in canvas', () => {
        const expectedPosition: Point = { x: 100, y: 200 };
        const mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
            target: component.original.nativeElement.children.namedItem(LAYERS.CURSOR)?.children.namedItem('canvas') as EventTarget,
        } as MouseEvent;
        expect(component.isMouseInCanvas(mouseEvent)).toEqual(true);
    });

    it('isMouseInCanvas should return false if mouse is not in canvas', () => {
        const expectedPosition: Point = { x: -100, y: -200 };
        const mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
            target: null,
        } as MouseEvent;
        expect(component.isMouseInCanvas(mouseEvent)).toEqual(false);
    });

    it('isMouseInCanvas in canvas should return false if canvas doesnt exit', () => {
        const expectedPosition: Point = { x: 100, y: 200 };
        const mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
            target: null,
        } as MouseEvent;
        component.original.nativeElement = document.createElement('div');
        component.modified.nativeElement = document.createElement('div');
        expect(component.isMouseInCanvas(mouseEvent)).toEqual(false);
    });

    it('should subscribe to gameData on init', () => {
        component.gameData = {} as GameData;
        component['stateGameService'].gameData = { title: 'test' } as GameData;
        component['stateGameService'].gameDataChanged.next({ title: 'test' } as GameData);
        expect(component.gameData.title).toEqual('test');
    });

    it('ngAfterViewInit should call setUp of canvasGameService and stateGameService.controllerGameService', () => {
        const setUpSpy = spyOn(component['canvasGameService'], 'setUp');
        const setUpSpy2 = spyOn(component['controllerGameService'], 'setUp');
        component.ngAfterViewInit();
        expect(setUpSpy).toHaveBeenCalled();
        expect(setUpSpy2).toHaveBeenCalled();
    });

    it('should unsubscribe to gameData on destroy', () => {
        const gameDataSubscriptionSpy = spyOn(component['gameDataSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(gameDataSubscriptionSpy).toHaveBeenCalled();
    });
});
