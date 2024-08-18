import { ElementRef } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, FLASHES, LAYERS, TIME } from '@common/constants';
import { ChatMessage, Difference, GameData, GameEvent, PlayerData, Point, Rectangle } from '@common/interfaces';
import { Subject } from 'rxjs';
import { CanvasGameService } from './canvas.game.service';
import { ChatGameService } from './chat.game.service';
import { DifferenceManipulationsService } from './difference-manipulations.game.service';
import { HintService } from './hint.game.service';
import { StateGameService } from './state.game.service';

class MockStateGameService {
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    replayEvents: GameEvent[] = [];
    chatHistory: ChatMessage[] = [];
    chatHistoryChanged = new Subject<ChatMessage[]>();
    time: number = 0;
    timeChanged = new Subject<number>();
    gameDataChanged = new Subject<GameData>();
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    currentPlayerUsername: string = '';
    get currentPlayer(): PlayerData {
        return this.players.find((player) => player.username === this.currentPlayerUsername) as PlayerData;
    }
}

class MockHintService {
    reset() {
        return;
    }
    handleHint() {
        return;
    }
    isHintAvailable() {
        return true;
    }
}

class MockChatGameService {
    addChatMessage() {
        return;
    }
    setFoundDifferences() {
        return;
    }
    setHintUsed() {
        return;
    }
}

class MockDifferenceManipulationsService {
    getDifferenceRectangle() {
        return;
    }
    differencesInclude() {
        return true;
    }
}

describe('CanvasService', () => {
    let service: CanvasGameService;
    let fakeClock: jasmine.Clock;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
                {
                    provide: HintService,
                    useClass: MockHintService,
                },
                {
                    provide: ChatGameService,
                    useClass: MockChatGameService,
                },
                {
                    provide: DifferenceManipulationsService,
                    useClass: MockDifferenceManipulationsService,
                },
            ],
        });
        service = TestBed.inject(CanvasGameService);
        fakeClock = jasmine.clock();
        fakeClock.install();
        canvas = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        service.modifiedLayersContexts.set(LAYERS.ERROR, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.modifiedLayersContexts.set(LAYERS.CURSOR, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.modifiedLayersContexts.set(LAYERS.DIFFERENCE_FOUND, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.modifiedLayersContexts.set(LAYERS.FLASH_DIFFERENCE, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.modifiedLayersContexts.set(LAYERS.HINT, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.modifiedLayersContexts.set(LAYERS.IMAGE, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.originalLayersContexts.set(LAYERS.ERROR, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.originalLayersContexts.set(LAYERS.CURSOR, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.originalLayersContexts.set(LAYERS.DIFFERENCE_FOUND, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.originalLayersContexts.set(LAYERS.FLASH_DIFFERENCE, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.originalLayersContexts.set(LAYERS.HINT, canvas.getContext('2d') as CanvasRenderingContext2D);
        service.originalLayersContexts.set(LAYERS.IMAGE, canvas.getContext('2d') as CanvasRenderingContext2D);
    });

    afterEach(() => {
        fakeClock.uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('hint should call handleHint', () => {
        service.gameData.differences = [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] }];
        service.players[0] = {
            username: 'test',
            differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] }],
            invalidMoves: [],
        };
        spyOn(service['stateGameService'].timeChanged, 'next').and.returnValue();
        const hintSpy = spyOn(service['hintService'], 'handleHint').and.returnValue();
        const diffManipSpy = spyOn(service['diffManip'], 'differencesInclude').and.callFake(() => {
            return false;
        });
        service.hint();
        expect(hintSpy).toHaveBeenCalled();
        expect(diffManipSpy).toHaveBeenCalled();
    });

    it('hint should call handleHint and do nothing', () => {
        spyOn(service['hintService'], 'isHintAvailable').and.returnValue(false);
        const handleHintSpy = spyOn(service['hintService'], 'handleHint').and.returnValue();
        service.hint();
        expect(handleHintSpy).not.toHaveBeenCalled();
    });

    it('resetHints should call reset of hintService', () => {
        const spy = spyOn(service['hintService'], 'reset').and.returnValue();
        service.resetHints();
        expect(spy).toHaveBeenCalled();
    });

    it('should subscribe to gameDataChanged', () => {
        const expected: GameData = { id: 0 } as GameData;
        service.gameData = { id: 1 } as GameData;
        service['stateGameService'].gameData = expected;
        service['stateGameService'].gameDataChanged.next(expected);
        expect(service.gameData).toBe(expected);
    });

    it('should subscribe to playersChanged', () => {
        const expected: PlayerData[] = [{ username: 'test', differencesFound: [], invalidMoves: [] }];
        service.players = [];
        service['stateGameService'].players = expected;
        service['stateGameService'].playersChanged.next(expected);
        expect(service.players).toBe(expected);
    });

    it('should call checkForNewDifferenceFound and checkForNewInvalidMove on playersChanged', () => {
        const checkForNewDifferenceFoundSpy = spyOn(service, 'checkForNewDifferenceFound');
        const checkForNewInvalidMoveSpy = spyOn(service, 'checkForNewInvalidMove');
        service['stateGameService'].players = [{ username: 'test', differencesFound: [], invalidMoves: [] }];
        service['stateGameService'].playersChanged.next(service['stateGameService'].players);
        expect(checkForNewDifferenceFoundSpy).toHaveBeenCalled();
        expect(checkForNewInvalidMoveSpy).toHaveBeenCalled();
    });

    it('setUp should call all three setup functions if gameId is defined', () => {
        service['originalMultiLayerDiv'] = new ElementRef<HTMLDivElement>(document.createElement('div'));
        service['modifiedMultiLayerDiv'] = new ElementRef<HTMLDivElement>(document.createElement('div'));
        service.gameData = { id: 1 } as GameData;
        const setUpContextsSpy = spyOn(service, 'setUpContexts');
        const setUpSourcesSpy = spyOn(service, 'setUpSources');
        const setUpImagesSpy = spyOn(service, 'setUpImages').and.callFake(async () => {
            return new Promise((resolve) => {
                resolve();
            });
        });
        service.setUp();
        expect(setUpContextsSpy).toHaveBeenCalled();
        expect(setUpSourcesSpy).toHaveBeenCalled();
        expect(setUpImagesSpy).toHaveBeenCalled();
    });

    it('setUp should not call any setup functions if gameId is not defined', () => {
        const setUpContextsSpy = spyOn(service, 'setUpContexts').and.returnValue();
        const setUpSourcesSpy = spyOn(service, 'setUpSources').and.returnValue();
        const setUpImagesSpy = spyOn(service, 'setUpImages').and.callFake(async () => {
            return new Promise((resolve) => {
                resolve();
            });
        });
        service.setUp();
        expect(setUpContextsSpy).not.toHaveBeenCalled();
        expect(setUpSourcesSpy).not.toHaveBeenCalled();
        expect(setUpImagesSpy).not.toHaveBeenCalled();
    });

    it('setUpContexts should map the context of all canvas elements', () => {
        service.layers = [LAYERS.IMAGE];
        const originalMultiLayerDiv = document.createElement('div');
        const originalSingleCanvasComponent = document.createElement('app-single-canvas');
        const originalCanvas = document.createElement('canvas');
        originalMultiLayerDiv.appendChild(originalSingleCanvasComponent);
        originalSingleCanvasComponent.appendChild(originalCanvas);
        spyOn(originalMultiLayerDiv.children, 'namedItem').and.returnValue(originalSingleCanvasComponent);
        spyOn(originalSingleCanvasComponent.children, 'namedItem').and.returnValue(originalCanvas);
        service.originalMultiLayerDiv = { nativeElement: originalMultiLayerDiv };
        const modifiedMultiLayerDiv = document.createElement('div');
        const modifiedSingleCanvasComponent = document.createElement('app-single-canvas');
        const modifiedCanvas = document.createElement('canvas');
        modifiedMultiLayerDiv.appendChild(modifiedSingleCanvasComponent);
        modifiedSingleCanvasComponent.appendChild(modifiedCanvas);
        spyOn(modifiedMultiLayerDiv.children, 'namedItem').and.returnValue(modifiedSingleCanvasComponent);
        spyOn(modifiedSingleCanvasComponent.children, 'namedItem').and.returnValue(modifiedCanvas);
        service.modifiedMultiLayerDiv = { nativeElement: modifiedMultiLayerDiv };
        service.setUpContexts();
        expect(service.originalLayersContexts.get(LAYERS.IMAGE)).toBe(originalCanvas.getContext('2d') as CanvasRenderingContext2D);
        expect(service.modifiedLayersContexts.get(LAYERS.IMAGE)).toBe(modifiedCanvas.getContext('2d') as CanvasRenderingContext2D);
    });

    it('setUpSources should set the sources of the two images', () => {
        const testId = 1;
        service.gameData = { id: testId } as GameData;
        service.setUpSources();
        expect(service.originalImageSrc).toBe(`http://localhost:3000/api/storage/originalImage/${testId}.bmp`);
        expect(service.modifiedImageSrc).toBe(`http://localhost:3000/api/storage/modifiedImage/${testId}.bmp`);
    });

    it('setUpImages should set the images of the two images', (done) => {
        spyOn(HTMLImageElement.prototype, 'setAttribute').and.stub();
        spyOn(CanvasRenderingContext2D.prototype, 'drawImage').and.stub();
        const originalCanvas = document.createElement('canvas');
        spyOn(service.originalLayersContexts, 'get').and.returnValue(originalCanvas.getContext('2d') as CanvasRenderingContext2D);
        const modifiedCanvas = document.createElement('canvas');
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(modifiedCanvas.getContext('2d') as CanvasRenderingContext2D);
        service.originalImageSrc = 'assets/pixel.bmp';
        service.modifiedImageSrc = 'assets/pixel.bmp';
        service.setUpImages().then(() => {
            expect(service.originalImage.setAttribute).toHaveBeenCalledWith('crossOrigin', 'anonymous');
            expect(service.modifiedLayersContexts.get(LAYERS.IMAGE)?.drawImage).toHaveBeenCalled();
            expect(service.modifiedImage.setAttribute).toHaveBeenCalledWith('crossOrigin', 'anonymous');
            expect(service.originalLayersContexts.get(LAYERS.IMAGE)?.drawImage).toHaveBeenCalled();
            done();
        });
        service.originalImage.dispatchEvent(new Event('load'));
        service.modifiedImage.dispatchEvent(new Event('load'));
        expect(service.originalImage).toBeInstanceOf(Image);
        expect(service.modifiedImage).toBeInstanceOf(Image);
    });

    it('checkForNewDifferenceFound should flash and play a noise if a new difference is found', () => {
        const flashDifferenceSpy = spyOn(service, 'flashDifference');
        const addFoundDifferenceSpy = spyOn(service, 'addFoundDifference');
        const playNoiseSpy = spyOn(service, 'playNoise');
        service.oldDifferenceFound = [];
        service['stateGameService'].players.push({
            username: 'test',
            differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference],
            invalidMoves: [],
        });
        spyOn(service['diffManip'], 'differencesInclude').and.returnValue(false);
        service.checkForNewDifferenceFound();
        expect(flashDifferenceSpy).toHaveBeenCalled();
        expect(addFoundDifferenceSpy).toHaveBeenCalled();
        expect(playNoiseSpy).toHaveBeenCalled();
        expect(service.oldDifferenceFound).toEqual(service['stateGameService'].players[0].differencesFound);
    });

    it('checkForNewDifferenceFound should not flash and not play a noise if no new difference is found', () => {
        const flashDifferenceSpy = spyOn(service, 'flashDifference').and.returnValue();
        const playNoiseSpy = spyOn(service, 'playNoise');
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        service.oldDifferenceFound = [difference];
        service['stateGameService'].players.push({
            username: 'test',
            differencesFound: [difference],
            invalidMoves: [],
        });
        service.checkForNewDifferenceFound();
        expect(flashDifferenceSpy).not.toHaveBeenCalled();
        expect(playNoiseSpy).not.toHaveBeenCalled();
        expect(service.oldDifferenceFound).toEqual(service['stateGameService'].players[0].differencesFound);
    });

    it('checkForNewInvalidMove should drawErrorMessage and play a error noise if a new invalid move is added', () => {
        const drawErrorMessageSpy = spyOn(service, 'drawErrorMessage').and.returnValue();
        const playErrorSpy = spyOn(service, 'playError');
        service['stateGameService'].currentPlayerUsername = 'test';
        service['stateGameService'].players.push({
            username: 'test',
            differencesFound: [],
            invalidMoves: [{ x: 0, y: 0 } as Point],
        });
        service.checkForNewInvalidMove();
        expect(drawErrorMessageSpy).toHaveBeenCalled();
        expect(playErrorSpy).toHaveBeenCalled();
    });

    it('checkForNewInvalidMove should clearErrorMessages if there are no invalid moves', () => {
        const drawErrorMessageSpy = spyOn(service, 'drawErrorMessage');
        const playErrorSpy = spyOn(service, 'playError');
        const clearErrorMessagesSpy = spyOn(service, 'clearErrorMessages');
        service['stateGameService'].currentPlayerUsername = 'test';
        service['stateGameService'].players.push({
            username: 'test',
            differencesFound: [],
            invalidMoves: [],
        });
        service.checkForNewInvalidMove();
        expect(drawErrorMessageSpy).not.toHaveBeenCalled();
        expect(playErrorSpy).not.toHaveBeenCalled();
        expect(clearErrorMessagesSpy).toHaveBeenCalled();
    });

    it('flashDifference should do nothing if the originalLayersContexts for LAYERS.FLASH_DIFFERENCE doesnt exist', () => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        spyOn(service.originalLayersContexts, 'get').and.returnValue(undefined);
        service.flashDifference(difference);
        expect(service.originalLayersContexts.get).toHaveBeenCalledWith(LAYERS.FLASH_DIFFERENCE);
    });

    it('flashDifference should do nothing if the modifiedLayersContexts for LAYERS.FLASH_DIFFERENCE doesnt exist', () => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        spyOn(service.originalLayersContexts, 'get').and.returnValue(document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D);
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(undefined);
        service.flashDifference(difference);
        expect(service.modifiedLayersContexts.get).toHaveBeenCalledWith(LAYERS.FLASH_DIFFERENCE);
    });

    it('addFoundDifference should do nothing if the originalLayersContexts for LAYERS.DIFFERENCE_FOUND doesnt exist', () => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        spyOn(service.originalLayersContexts, 'get').withArgs(LAYERS.DIFFERENCE_FOUND).and.returnValue(undefined);
        service.addFoundDifference(difference);
        expect(service.originalLayersContexts.get).toHaveBeenCalledWith(LAYERS.DIFFERENCE_FOUND);
    });

    it('addFoundDifference should do nothing if the modifiedLayersContexts for LAYERS.DIFFERENCE_FOUND doesnt exist', () => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        spyOn(service.originalLayersContexts, 'get')
            .withArgs(LAYERS.DIFFERENCE_FOUND)
            .and.returnValue(document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D);
        spyOn(service.modifiedLayersContexts, 'get').withArgs(LAYERS.DIFFERENCE_FOUND).and.returnValue(undefined);
        service.addFoundDifference(difference);
        expect(service.modifiedLayersContexts.get).toHaveBeenCalledWith(LAYERS.DIFFERENCE_FOUND);
    });

    it('flashDifference should call drawDifference with the flashDifference layer', fakeAsync(() => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        const drawDifferenceSpy = spyOn(service, 'drawDifference').and.returnValue();
        const originalContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const modifiedContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        spyOn(service.originalLayersContexts, 'get').withArgs(LAYERS.FLASH_DIFFERENCE).and.returnValue(originalContext);
        spyOn(service.modifiedLayersContexts, 'get').withArgs(LAYERS.FLASH_DIFFERENCE).and.returnValue(modifiedContext);
        service.flashDifference(difference);
        tick(TIME.ONE_TENTH_SECOND * FLASHES * 2 + 1);
        expect(drawDifferenceSpy).toHaveBeenCalledWith(originalContext, service.modifiedImage, difference);
        expect(drawDifferenceSpy).toHaveBeenCalledWith(modifiedContext, service.originalImage, difference);
    }));

    it('addFoundDifference should call drawDifference with the flashDifference layer', fakeAsync(() => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        const drawDifferenceSpy = spyOn(service, 'drawDifference');
        const originalContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const modifiedContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        spyOn(service.originalLayersContexts, 'get').withArgs(LAYERS.DIFFERENCE_FOUND).and.returnValue(originalContext);
        spyOn(service.modifiedLayersContexts, 'get').withArgs(LAYERS.DIFFERENCE_FOUND).and.returnValue(modifiedContext);
        service.addFoundDifference(difference);
        tick(TIME.ONE_TENTH_SECOND * FLASHES * 2 + 1);
        expect(drawDifferenceSpy).toHaveBeenCalledWith(originalContext, service.modifiedImage, difference);
        expect(drawDifferenceSpy).toHaveBeenCalledWith(modifiedContext, service.originalImage, difference);
    }));

    it('clearDifference should clear a difference', () => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const clearRectSpy = spyOn(context, 'clearRect');
        service.clearDifference(context, difference);
        expect(clearRectSpy).toHaveBeenCalled();
    });

    it('drawDifference should draw a difference', () => {
        const difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] } as Difference;
        const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const drawImageSpy = spyOn(context, 'drawImage');
        service.drawDifference(context, service.modifiedImage, difference);
        expect(drawImageSpy).toHaveBeenCalled();
    });

    it('clearErrorMessages should do nothing if the originalLayersContexts for LAYERS.ERROR doesnt exist', () => {
        spyOn(service.originalLayersContexts, 'get').and.returnValue(undefined);
        service.clearErrorMessages();
        expect(service.originalLayersContexts.get).toHaveBeenCalledWith(LAYERS.ERROR);
    });

    it('clearErrorMessages should do nothing if the modifiedLayersContexts for LAYERS.ERROR doesnt exist', () => {
        spyOn(service.originalLayersContexts, 'get').and.returnValue(document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D);
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(undefined);
        service.clearErrorMessages();
        expect(service.modifiedLayersContexts.get).toHaveBeenCalledWith(LAYERS.ERROR);
    });

    it('clearErrorMessages should call clearRect with the error layer', () => {
        const originalContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const modifiedContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        service.originalLayersContexts.set(LAYERS.ERROR, originalContext);
        service.modifiedLayersContexts.set(LAYERS.ERROR, modifiedContext);
        const clearRectSpy = spyOn(originalContext, 'clearRect');
        spyOn(service.originalLayersContexts, 'get').and.returnValue(originalContext);
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(modifiedContext);
        service.clearErrorMessages();
        expect(clearRectSpy).toHaveBeenCalled();
    });

    it('drawErrorMessage should do nothing if the originalLayersContexts for LAYERS.ERROR doesnt exist', () => {
        spyOn(service.originalLayersContexts, 'get').and.returnValue(undefined);
        const point = { x: 0, y: 0 };
        service.drawErrorMessage(point);
        expect(service.originalLayersContexts.get).toHaveBeenCalledWith(LAYERS.ERROR);
    });

    it('drawErrorMessage should do nothing if the modifiedLayersContexts for LAYERS.ERROR doesnt exist', () => {
        spyOn(service.originalLayersContexts, 'get').and.returnValue(document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D);
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(undefined);
        const point = { x: 0, y: 0 };
        service.drawErrorMessage(point);
        expect(service.modifiedLayersContexts.get).toHaveBeenCalledWith(LAYERS.ERROR);
    });

    it('drawErrorMessage should call fillText with the error layer and still stay inside the canvas (up left corner)', () => {
        const originalContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const modifiedContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const fillTextSpy = spyOn(originalContext, 'fillText');
        spyOn(service.originalLayersContexts, 'get').and.returnValue(originalContext);
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(modifiedContext);
        const point = { x: -1, y: -1 };
        service.drawErrorMessage(point);
        expect(fillTextSpy).toHaveBeenCalled();
    });

    it('drawErrorMessage should call fillText with the error layer and still stay inside the canvas (down right corner)', () => {
        const originalContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const modifiedContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const fillTextSpy = spyOn(originalContext, 'fillText');
        spyOn(service.originalLayersContexts, 'get').and.returnValue(originalContext);
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(modifiedContext);
        const point = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };
        service.drawErrorMessage(point);
        expect(fillTextSpy).toHaveBeenCalled();
    });

    it('should call audio.play() when playNoise() is called', () => {
        const spyPlay = spyOn(Audio.prototype, 'play').and.callFake(async () => {
            return Promise.resolve();
        });
        service.playNoise();
        service.audio[0].dispatchEvent(new Event('ended'));
        expect(spyPlay).toHaveBeenCalled();
    });

    it('resetReplay should set oldDifferencesFound to empty', () => {
        spyOn(service.originalLayersContexts, 'get').and.returnValue(undefined);
        spyOn(service.modifiedLayersContexts, 'get').and.returnValue(undefined);
        service.players = [{} as PlayerData];
        service.replayReset();
        expect(service.oldDifferenceFound.length).toEqual(0);
    });

    it('resetReplay should set oldDifferencesFound to empty', () => {
        service.players = [{} as PlayerData];
        service.replayReset();
        expect(service.oldDifferenceFound.length).toEqual(0);
    });

    it('resetReplay should call cheatMode if isFlashing', () => {
        service.isFlashing = true;
        const cheatModeSpy = spyOn(service, 'cheatMode');
        service.replayReset();
        expect(cheatModeSpy).toHaveBeenCalled();
    });

    it('should call audio.play() when playError() is called', () => {
        const spyPlay = spyOn(Audio.prototype, 'play').and.callFake(async () => {
            return Promise.resolve();
        });
        service.playError();
        service.audio[0].dispatchEvent(new Event('ended'));
        expect(spyPlay).toHaveBeenCalled();
    });

    it('cheatMode should iterate through the differences and call flashDifference', () => {
        const flashDifferenceSpy = spyOn(service, 'flashDifference');
        service['isFlashing'] = false;
        spyOn(service, 'getNotFoundDifferences').and.returnValue([{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }]);
        service.gameData = { differences: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }] } as GameData;
        service.cheatMode();
        expect(flashDifferenceSpy).toHaveBeenCalled();
    });

    it('cheatMode should set isFlashing to true and iterate through the differences and call flashDifference each second', fakeAsync(() => {
        const flashDifferenceSpy = spyOn(service, 'flashDifference').and.returnValue();
        service['isFlashing'] = false;
        spyOn(service, 'getNotFoundDifferences').and.returnValue([{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }]);
        service.gameData = { differences: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }] } as GameData;
        service.cheatMode();
        tick(TIME.FIVE_SECONDS);
        expect(flashDifferenceSpy).toHaveBeenCalled();
        clearInterval(service['intervalId']);
    }));

    it('cheatMode should not iterate through the differences and call flashDifference if isFlashing is true', () => {
        const flashDifferenceSpy = spyOn(service, 'flashDifference');
        service['isFlashing'] = true;
        service.gameData = { differences: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 1, y: 1 } }] }] } as GameData;
        service.cheatMode();
        expect(flashDifferenceSpy).not.toHaveBeenCalled();
    });

    it('isSameRectangle should be true', () => {
        const rectangle1: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } };
        const rectangle2: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } };
        expect(service.isSameRectangle(rectangle1, rectangle2)).toBe(true);
    });

    it('isSameRectangle should be false', () => {
        const rectangle1: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 1, y: 0 } };
        const rectangle2: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } };
        expect(service.isSameRectangle(rectangle1, rectangle2)).toBe(false);
    });

    it('isSameDifference should be true', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference2: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        expect(service.isSameDifference(difference1, difference2)).toBe(true);
    });

    it('isSameDifference should be false', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference2: Difference = { rectangles: [{ point1: { x: 1, y: 0 }, point2: { x: 0, y: 0 } }] };
        expect(service.isSameDifference(difference1, difference2)).toBe(false);
    });

    it('isSameDifference should be false', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference2: Difference = { rectangles: [] };
        expect(service.isSameDifference(difference1, difference2)).toBe(false);
    });

    it('getNotFoundDifferences should return good differences', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference2: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference3: Difference = { rectangles: [{ point1: { x: 1, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference4: Difference = { rectangles: [{ point1: { x: 2, y: 0 }, point2: { x: 0, y: 0 } }] };
        const differences: Difference[] = [difference1, difference3, difference4];
        const differencesFound: Difference[] = [difference2, difference4];
        expect(service.getNotFoundDifferences(differences, differencesFound).length).toEqual(1);
    });
});
