import { discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { CONFIGURATION_GAME_CONSTANTS, FLASHES, GAME_TIMER_MODE, HINT_WIDTH, Quadrant, TIME } from '@common/constants';
import { Difference, GameConstants, GameEvent, Point, Rectangle } from '@common/interfaces';
import { Subject } from 'rxjs';
import { HintService } from './hint.game.service';
import { StateGameService } from './state.game.service';

class MockStateGameService {
    time: number = 0;
    timeChanged = new Subject<number>();
    gameConstantsChanged = new Subject<GameConstants[]>();
    replayEvents: GameEvent[] = [];
}

describe('HintService', () => {
    let service: HintService;
    let startPoint: Point;
    let contexts: CanvasRenderingContext2D[];
    const tickTime = 16;
    const width = 100;
    const height = 50;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: StateGameService, useClass: MockStateGameService }],
        });
        service = TestBed.inject(HintService);
        startPoint = { x: 0, y: 0 };
        contexts = [document.createElement('canvas').getContext('2d')] as CanvasRenderingContext2D[];
        service.numberOfHints = 0;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getQuadrant', () => {
        it('should return LEFT_UP when point is in the upper left quadrant', () => {
            const rectangle: Rectangle = { point1: { x: 100, y: 100 }, point2: { x: 200, y: 200 } };
            const quadrant = service.getQuadrant(rectangle);
            expect(quadrant).toEqual(Quadrant.LEFT_UP);
        });

        it('should return LEFT_DOWN when point is in the lower left quadrant', () => {
            const rectangle: Rectangle = { point1: { x: 100, y: 300 }, point2: { x: 200, y: 400 } };
            const quadrant = service.getQuadrant(rectangle);
            expect(quadrant).toEqual(Quadrant.LEFT_DOWN);
        });

        it('should return RIGHT_UP when point is in the upper right quadrant', () => {
            const rectangle: Rectangle = { point1: { x: 400, y: 100 }, point2: { x: 500, y: 200 } };
            const quadrant = service.getQuadrant(rectangle);
            expect(quadrant).toEqual(Quadrant.RIGHT_UP);
        });

        it('should return RIGHT_DOWN when point is in the lower right quadrant', () => {
            const rectangle: Rectangle = { point1: { x: 400, y: 300 }, point2: { x: 500, y: 400 } };
            const quadrant = service.getQuadrant(rectangle);
            expect(quadrant).toEqual(Quadrant.RIGHT_DOWN);
        });
    });

    it('should pick a difference from the given array', () => {
        const differences: Difference[] = [
            {
                rectangles: [
                    { point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } },
                    { point1: { x: 20, y: 20 }, point2: { x: 30, y: 30 } },
                ],
            },
            {
                rectangles: [
                    { point1: { x: 5, y: 5 }, point2: { x: 15, y: 15 } },
                    { point1: { x: 25, y: 25 }, point2: { x: 35, y: 35 } },
                ],
            },
        ];
        const randomValue = 0.5;
        spyOn(Math, 'random').and.returnValue(randomValue);
        const result = service.pickDifference(differences);
        expect(result).toEqual(differences[1]); // The second difference should be picked because Math.random returns 0.5
    });

    it('should set middleX and middleY if numberOfHints is 2', () => {
        spyOn(Math, 'random').and.returnValue(0);
        const differences: Difference[] = [
            {
                rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 2, y: 2 } }],
            },
            {
                rectangles: [{ point1: { x: 5, y: 5 }, point2: { x: 15, y: 15 } }],
            },
        ];
        service.numberOfHints = 2;
        service.pickDifference(differences);
        expect(service.middleX).toEqual(1);
        expect(service.middleY).toEqual(1);
    });

    it('should return a rectangle that encompasses all rectangles in the difference', () => {
        const difference: Difference = {
            rectangles: [
                { point1: { x: 10, y: 10 }, point2: { x: 20, y: 20 } },
                { point1: { x: 15, y: 15 }, point2: { x: 25, y: 25 } },
                { point1: { x: 5, y: 5 }, point2: { x: 15, y: 15 } },
            ],
        };
        const resultBorder: Rectangle = { point1: { x: 5, y: 5 }, point2: { x: 25, y: 25 } };
        const result: Rectangle = service.getDifferenceBorder(difference);

        expect(result.point1.x).toBe(resultBorder.point1.x);
        expect(result.point1.y).toBe(resultBorder.point1.y);
        expect(result.point2.x).toBe(resultBorder.point2.x);
        expect(result.point2.y).toBe(resultBorder.point2.y);
    });

    it('should return correct point for quadrant 1', () => {
        const rectangle: Rectangle = { point1: { x: 10, y: 10 }, point2: { x: 15, y: 15 } };
        const expectedPoint: Point = { x: 0, y: 0 };
        expect(service.fromQuadrantTo16QuadrantPoint(rectangle)).toEqual(expectedPoint);
    });

    it('should return correct point for quadrant 2', () => {
        const rectangle: Rectangle = { point1: { x: 10, y: 165 }, point2: { x: 15, y: 170 } };
        const expectedPoint: Point = { x: 0, y: 120 };
        expect(service.fromQuadrantTo16QuadrantPoint(rectangle)).toEqual(expectedPoint);
    });

    it('should return correct point for quadrant 3', () => {
        const rectangle: Rectangle = { point1: { x: 180, y: 10 }, point2: { x: 190, y: 15 } };
        const expectedPoint: Point = { x: 160, y: 0 };
        expect(service.fromQuadrantTo16QuadrantPoint(rectangle)).toEqual(expectedPoint);
    });

    it('should return correct point for quadrant 4', () => {
        const rectangle: Rectangle = { point1: { x: 180, y: 165 }, point2: { x: 190, y: 170 } };
        const expectedPoint: Point = { x: 160, y: 120 };
        expect(service.fromQuadrantTo16QuadrantPoint(rectangle)).toEqual(expectedPoint);
    });

    it('should return correct point for quadrant(4) 1', () => {
        expect(service.fromQuadrantToPoint(Quadrant.LEFT_DOWN)).toEqual({ x: 0, y: 240 });
    });

    it('should return correct point for quadrant(4) 2', () => {
        expect(service.fromQuadrantToPoint(Quadrant.LEFT_UP)).toEqual({ x: 0, y: 0 });
    });

    it('should return correct point for quadrant(4) 3', () => {
        expect(service.fromQuadrantToPoint(Quadrant.RIGHT_UP)).toEqual({ x: 320, y: 0 });
    });

    it('should return correct point for quadrant(4) 4', () => {
        expect(service.fromQuadrantToPoint(Quadrant.RIGHT_DOWN)).toEqual({ x: 320, y: 240 });
    });

    it('should draw hint on specified point with specified width and height', fakeAsync(() => {
        const point = { x: 10, y: 10 };
        const newWidth = 50;
        const newHeight = 50;
        const mockContexts: CanvasRenderingContext2D[] = [document.createElement('canvas').getContext('2d')] as CanvasRenderingContext2D[];

        spyOn(service, 'setUpHint').and.callThrough();
        spyOn(service, 'drawRect').and.callThrough();
        spyOn(service, 'clearHints').and.callThrough();

        service.drawHint(mockContexts, point, { width: newWidth, height: newHeight });

        tick(TIME.ONE_TENTH_SECOND * (FLASHES * 2 + 1));
        expect(service.setUpHint).toHaveBeenCalled();
        expect(service.drawRect).toHaveBeenCalled();
        expect(service.drawRect).toHaveBeenCalledWith(point, mockContexts, { width: newWidth, height: newHeight });
        expect(service.clearHints).toHaveBeenCalled();
    }));

    it('should draw a rectangle in all provided contexts', () => {
        spyOn(contexts[0], 'strokeRect');
        service.drawRect(startPoint, contexts, { width, height });
        expect(contexts[0].strokeRect).toHaveBeenCalledWith(HINT_WIDTH / 2, HINT_WIDTH / 2, width - HINT_WIDTH, height - HINT_WIDTH);
    });

    it('should stroke the rectangle', () => {
        spyOn(contexts[0], 'strokeRect');
        service.drawRect(startPoint, contexts, { width, height });
        expect(contexts[0].strokeRect).toHaveBeenCalled();
    });

    it('should animate until reaching the middle point', fakeAsync(() => {
        const speed = 4;
        const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        service.animateX = 0;
        service.animateY = 0;
        service.middleX = 100;
        service.middleY = 100;

        service.animate([context]);
        tick(tickTime);

        expect(service.animateX).toBeGreaterThan(0);
        expect(service.animateY).toBeGreaterThan(0);

        tick(tickTime);
        expect(service.animateX).toBeGreaterThan(speed);
        expect(service.animateY).toBeGreaterThan(speed);

        while (service.animateX < service.middleX || service.animateY < service.middleY) {
            tick(tickTime);
        }
    }));

    it('should animate until reaching the middle point', fakeAsync(() => {
        const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        const speed = 4;
        service.animateX = 110;
        service.animateY = 110;
        service.middleX = 100;
        service.middleY = 100;

        service.animate([context]);
        tick(tickTime);

        expect(service.animateX).toBeGreaterThan(0);
        expect(service.animateY).toBeGreaterThan(0);

        tick(tickTime);
        expect(service.animateX).toBeGreaterThan(speed);
        expect(service.animateY).toBeGreaterThan(speed);

        while (service.animateX < service.middleX || service.animateY < service.middleY) {
            tick(tickTime);
        }

        flush();
    }));

    it('should be available', () => {
        expect(service.isHintAvailable()).toBe(true);
    });

    it('should not be available', () => {
        service.numberOfHints = 5;
        expect(service.isHintAvailable()).toBe(false);
    });

    it('should handle hint case 0', fakeAsync(() => {
        const mockContexts: CanvasRenderingContext2D[] = [
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
        ];
        const mockDifferences = [
            {
                rectangles: [
                    {
                        point1: { x: 0, y: 0 },
                        point2: { x: 100, y: 100 },
                    },
                ],
            },
        ];

        const spy1 = spyOn(service, 'getQuadrant').and.returnValue(1);
        const spy2 = spyOn(service, 'fromQuadrantToPoint').and.returnValue({ x: 0, y: 0 });
        const spy3 = spyOn(service, 'drawHint');
        const spy4 = spyOn(service, 'pickDifference').and.returnValue(mockDifferences[0]);
        const spy5 = spyOn(service, 'getDifferenceBorder').and.returnValue(mockDifferences[0].rectangles[0]);

        service.handleHint(mockContexts, mockDifferences);

        tick(TIME.TEN_SECONDS);

        discardPeriodicTasks();

        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
        expect(spy3).toHaveBeenCalled();
        expect(spy4).toHaveBeenCalled();
        expect(spy5).toHaveBeenCalled();

        flush();
    }));

    it('should do nothing handleHint', () => {
        service.numberOfHints = 768;
        const mockContexts: CanvasRenderingContext2D[] = [
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
        ];
        const mockDifferences = [
            {
                rectangles: [
                    {
                        point1: { x: 0, y: 0 },
                        point2: { x: 100, y: 100 },
                    },
                ],
            },
        ];
        const pickDifferenceSpy = spyOn(service, 'pickDifference');
        service.handleHint(mockContexts, mockDifferences);
        expect(pickDifferenceSpy).not.toHaveBeenCalled();
    });

    it('should handle hint case 1', fakeAsync(() => {
        const mockContexts: CanvasRenderingContext2D[] = [
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
        ];
        const mockDifferences = [
            {
                rectangles: [
                    {
                        point1: { x: 0, y: 0 },
                        point2: { x: 100, y: 100 },
                    },
                ],
            },
        ];

        service.numberOfHints = 1;

        const spy3 = spyOn(service, 'drawHint');
        const spy4 = spyOn(service, 'pickDifference').and.returnValue(mockDifferences[0]);
        const spy5 = spyOn(service, 'getDifferenceBorder').and.returnValue(mockDifferences[0].rectangles[0]);
        const spy6 = spyOn(service, 'fromQuadrantTo16QuadrantPoint').and.returnValue({ x: 0, y: 0 });

        service.handleHint(mockContexts, mockDifferences);

        tick(TIME.TEN_SECONDS);

        discardPeriodicTasks();

        expect(spy3).toHaveBeenCalled();
        expect(spy4).toHaveBeenCalled();
        expect(spy5).toHaveBeenCalled();
        expect(spy6).toHaveBeenCalled();

        flush();
    }));

    it('should handle hint case 2', fakeAsync(() => {
        const mockContexts: CanvasRenderingContext2D[] = [
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
        ];
        const mockDifferences = [
            {
                rectangles: [
                    {
                        point1: { x: 0, y: 0 },
                        point2: { x: 100, y: 100 },
                    },
                ],
            },
        ];
        service.numberOfHints = 2;
        const spy4 = spyOn(service, 'pickDifference').and.returnValue(mockDifferences[0]);
        service.handleHint(mockContexts, mockDifferences);
        tick(TIME.TEN_SECONDS);
        discardPeriodicTasks();
        expect(spy4).toHaveBeenCalled();
        flush();
    }));

    it('handle hint should add the time penalty if timer mode is classic', () => {
        const mockContexts: CanvasRenderingContext2D[] = [
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
        ];
        const mockDifferences = [
            {
                rectangles: [
                    {
                        point1: { x: 0, y: 0 },
                        point2: { x: 100, y: 100 },
                    },
                ],
            },
        ];
        service.numberOfHints = 2;
        service.timePenalty = 1;
        service['stateGameService'].time = 0;
        service['stateGameService'].timerMode = GAME_TIMER_MODE.CLASSIC;
        service.handleHint(mockContexts, mockDifferences);
        expect(service['stateGameService'].time).toEqual(1);
    });

    it('handle hint should remove the time penalty if timer mode is classic', () => {
        const mockContexts: CanvasRenderingContext2D[] = [
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
            document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
        ];
        const mockDifferences = [
            {
                rectangles: [
                    {
                        point1: { x: 0, y: 0 },
                        point2: { x: 100, y: 100 },
                    },
                ],
            },
        ];
        service.numberOfHints = 2;
        service.timePenalty = 1;
        service['stateGameService'].time = 1;
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        service.handleHint(mockContexts, mockDifferences);
        expect(service['stateGameService'].time).toEqual(0);
    });

    it('should reset', () => {
        service.numberOfHints = 5;
        service.animateX = 10;
        service.animateY = 10;
        service.reset();
        expect(service.numberOfHints).toBe(0);
        expect(service.animateX).toBe(0);
        expect(service.animateY).toBe(0);
    });

    it('should change penalty time', () => {
        service.timePenalty = 1;
        service['stateGameService'].gameConstantsChanged.next(CONFIGURATION_GAME_CONSTANTS);
        expect(service.timePenalty).toEqual(CONFIGURATION_GAME_CONSTANTS[1].time);
    });
});
