import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GAME_EVENTS, TIME } from '@common/constants';
import { ChatMessage, Difference, GameEvent, PlayerData } from '@common/interfaces';
import { Subject } from 'rxjs';
import { CanvasGameService } from './game/canvas.game.service';
import { ChatGameService } from './game/chat.game.service';
import { HintService } from './game/hint.game.service';
import { StateGameService } from './game/state.game.service';
import { ValidationGameService } from './game/validation.game.service';
import { ReplayService } from './replay.service';

class MockStateGameService {
    time: number = 0;
    timeChanged = new Subject<number>();
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    chatHistory: ChatMessage[] = [];
    chatHistoryChanged = new Subject<ChatMessage[]>();
    gameEnded: boolean = false;
    replayEvents: GameEvent[] = [];
}

class MockCanvasGameService {
    originalLayersContexts: Map<string, CanvasRenderingContext2D> = new Map();
    modifiedLayersContexts: Map<string, CanvasRenderingContext2D> = new Map();
    oldDifferenceFound: Difference[] = [];
    cheatMode() {
        return;
    }
    replayReset() {
        return;
    }
}

class MockValidationGameService {
    invalidMoveMade() {
        return;
    }
}

class MockChatGameService {
    setHintUsed() {
        return;
    }
    addChatMessage() {
        return;
    }
    setFoundDifferences() {
        return;
    }
}

class MockHintService {
    handleHint() {
        return;
    }
    reset() {
        return;
    }
}

describe('ReplayService', () => {
    let service: ReplayService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: StateGameService, useClass: MockStateGameService },
                { provide: CanvasGameService, useClass: MockCanvasGameService },
                { provide: ValidationGameService, useClass: MockValidationGameService },
                { provide: ChatGameService, useClass: MockChatGameService },
                { provide: HintService, useClass: MockHintService },
            ],
        });
        service = TestBed.inject(ReplayService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('play should do nothing', () => {
        const spyHandleEvent = spyOn(service, 'handleEvent').and.returnValue();
        service.isPlaying = true;
        service.play();
        expect(spyHandleEvent).not.toHaveBeenCalled();
    });

    it('play should do something', fakeAsync(() => {
        service.isPlaying = false;
        service.time = 0;
        const player: PlayerData = { username: 'test', differencesFound: [], invalidMoves: [] };
        const player2: PlayerData = { username: 'test2', differencesFound: [], invalidMoves: [] };
        service['stateService'].players = [player, player2];
        service.toDoEvents = [{ type: GAME_EVENTS.END, time: 4, eventData: {} }];
        service.play();
        tick(TIME.FIVE_SECONDS);
        expect(service.isPlaying).toBe(false);
    }));

    it('handle should handle cheatmode', () => {
        service.isPlaying = false;
        service.time = 5;
        service.toDoEvents = [{ type: GAME_EVENTS.CHEAT_MODE, time: 0, eventData: {} }];
        const spy = spyOn(service['canvasService'], 'cheatMode').and.returnValue();
        service.handleEvent();
        expect(spy).toHaveBeenCalled();
    });

    it('handle should handle hint', () => {
        service.isPlaying = false;
        service.time = 5;
        service.toDoEvents = [{ type: GAME_EVENTS.HINT, time: 0, eventData: {} }];
        const spy = spyOn(service['hintService'], 'handleHint').and.returnValue();
        service.handleEvent();
        expect(spy).toHaveBeenCalled();
    });

    it('handle should handle difference', () => {
        service.isPlaying = false;
        service.time = 5;
        service.toDoEvents = [{ type: GAME_EVENTS.DIFFERENCE_FOUND, time: 0, eventData: { username: 'test', differences: {} as Difference } }];
        const player: PlayerData = { username: 'test', differencesFound: [], invalidMoves: [] };
        const player2: PlayerData = { username: 'test2', differencesFound: [], invalidMoves: [] };
        service['stateService'].players = [player, player2];
        const spy = spyOn(service['chatService'], 'setFoundDifferences').and.returnValue({} as ChatMessage);
        service.handleEvent();
        expect(spy).toHaveBeenCalled();
    });

    it('handle should handle error', () => {
        service.isPlaying = false;
        service.time = 5;
        service.toDoEvents = [{ type: GAME_EVENTS.ERROR, time: 0, eventData: {} }];
        const spy = spyOn(service['validationService'], 'invalidMoveMade').and.returnValue();
        service.handleEvent();
        expect(spy).toHaveBeenCalled();
    });

    it('handle should handle message', () => {
        service.isPlaying = false;
        service.time = 5;
        const testChatMessage: ChatMessage = {
            username: 'test',
            message: 'test',
            time: 0,
            textColor: { r: 0, g: 0, b: 0 },
            backgroundColor: { r: 0, g: 0, b: 0 },
        };
        service.toDoEvents = [{ type: GAME_EVENTS.MESSAGE, time: 0, eventData: testChatMessage }];
        service.handleEvent();
        expect(service['stateService'].chatHistory.length).toBeGreaterThan(0);
    });

    it('stop should set isPlaying to false', () => {
        service.isPlaying = false;
        service.stop();
        expect(service.isPlaying).toBe(false);
    });

    it('changeSpeed should change speed', () => {
        service.isPlaying = false;
        service.changeSpeed(TIME.FIVE_SECONDS);
        expect(service.speed).toEqual(TIME.FIVE_SECONDS);
    });

    it('changeSpeed should change speed and play', () => {
        service.isPlaying = true;
        service.justEnded = false;
        service.changeSpeed(TIME.FIVE_SECONDS);
        service.toDoEvents = [{ type: GAME_EVENTS.END, time: 4, eventData: {} }];
        expect(service.speed).toEqual(TIME.FIVE_SECONDS);
    });

    it('replay should call reset', () => {
        service.isPlaying = false;
        service.replay();
        spyOn(service, 'reset').and.returnValue();
        expect(service.isPlaying).toBe(false);
    });

    it('replay should call reset and play', () => {
        service.isPlaying = true;
        service.replay();
        service.toDoEvents = [{ type: GAME_EVENTS.END, time: 4, eventData: {} }];
        spyOn(service, 'reset').and.returnValue();
        spyOn(service, 'play').and.returnValue();
        expect(service.isPlaying).toBe(true);
    });

    it('getEndTime should give the correct time', () => {
        service.gameEvents = [{ type: GAME_EVENTS.MESSAGE, time: 1, eventData: {} }];
        expect(service.getEndTime()).toEqual(1);
    });

    it('percentOfTimePassed should give 0', () => {
        service.time = 0;
        service.gameEvents = [{ type: GAME_EVENTS.MESSAGE, time: 10, eventData: {} }];
        expect(service.percentOfTimePassed()).toEqual(0);
    });

    it('findNumberOfHints should give 1', () => {
        service.time = 0;
        service.gameEvents = [{ type: GAME_EVENTS.HINT, time: 1, eventData: {} }];
        expect(service.findNumberOfHints(service.gameEvents)).toEqual(1);
    });

    it('getData should call reset', () => {
        service.isPlaying = false;
        service.getData();
        spyOn(service, 'reset').and.returnValue();
        expect(service.isPlaying).toBe(false);
    });
});
