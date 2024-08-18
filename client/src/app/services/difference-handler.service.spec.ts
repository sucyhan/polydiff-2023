import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@common/constants';
import { Difference, ImageDiffs, Point, PrivateFunction, Rectangle } from '@common/interfaces';
import { DifferenceHandlerService } from './difference-handler.service';

describe('DifferenceHandler', () => {
    let differenceHandler: DifferenceHandlerService;

    beforeEach(() => {
        differenceHandler = new DifferenceHandlerService();
    });

    it('should be created', () => {
        expect(differenceHandler).toBeTruthy();
    });

    it('should be one line {X: 0, y: 2}', () => {
        const diffs: Point[] = [];
        const line: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 2, y: 0 } };
        const testLine: Rectangle[] = [line];

        for (let i = 0; i < 3; i++) {
            diffs.push({ x: i, y: 0 });
        }

        const tested: Difference = differenceHandler['createLines'](diffs);

        expect(tested.rectangles.length).toBe(1);
        expect(JSON.stringify(tested)).toBe(JSON.stringify({ rectangles: testLine }));
    });

    it('should be 2 lines', () => {
        const diffs: Point[] = [];
        const line1: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 4, y: 0 } };
        const line2: Rectangle = { point1: { x: 5, y: 1 }, point2: { x: 6, y: 1 } };
        const testLine: Rectangle[] = [line1, line2];
        const difPoints = 7;
        const lineStopper = 5;

        for (let i = 0; i < difPoints; i++) {
            if (i < lineStopper) diffs.push({ x: i, y: 0 });
            else diffs.push({ x: i, y: 1 });
        }

        const tested: Difference = differenceHandler['createLines'](diffs);

        expect(tested.rectangles.length).toBe(2);
        expect(JSON.stringify(tested)).toBe(JSON.stringify({ rectangles: testLine }));
    });

    it('createLines should be called', () => {
        spyOn<PrivateFunction>(differenceHandler, 'createLines').and.returnValue({
            rectangles: [{ point1: { x: 3, y: 2 }, point2: { x: 3, y: 4 } }],
        });
        differenceHandler['createRectangles']([{ x: 1, y: 1 }]);
        expect(differenceHandler['createLines']).toHaveBeenCalled();
    });

    it('createRectangles should be called', () => {
        spyOn<PrivateFunction>(differenceHandler, 'createRectangles').and.returnValue({
            rectangles: [{ point1: { x: 3, y: 2 }, point2: { x: 3, y: 4 } }],
        });
        differenceHandler.getRecs([[{ x: 1, y: 1 }]]);
        expect(differenceHandler['createRectangles']).toHaveBeenCalled();
    });

    it('merge should be called', () => {
        const mergeSpy = spyOn<PrivateFunction>(differenceHandler, 'merge').and.returnValue([{ x: 3, y: 2 }]);
        differenceHandler['mergeSortDifPoints']([
            { x: 1, y: 1 },
            { x: 3, y: 2 },
        ]);
        expect(mergeSpy).toHaveBeenCalled();
    });

    it('should be one rectangle', () => {
        const difference: Point[] = [
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
        ];
        const expectedRectangle: Rectangle[] = [{ point1: { x: 1, y: 1 }, point2: { x: 2, y: 2 } }];

        expect(differenceHandler['createRectangles'](difference).rectangles).toEqual(expectedRectangle);
    });

    it('should be two rectangle', () => {
        const difference: Point[] = [
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 1, y: 2 },
        ];
        const expectedRectangle: Rectangle[] = [
            { point1: { x: 1, y: 1 }, point2: { x: 2, y: 1 } },
            { point1: { x: 1, y: 2 }, point2: { x: 1, y: 2 } },
        ];

        expect(differenceHandler['createRectangles'](difference).rectangles).toEqual(expectedRectangle);
    });

    it('should be 4 rectangles', () => {
        const difference: Point[] = [
            { x: 1, y: 1 },
            { x: 0, y: 2 },
            { x: 2, y: 2 },
            { x: 1, y: 3 },
        ];
        const expectedRectangles: Rectangle[] = [{ point1: { x: 1, y: 1 }, point2: { x: 1, y: 1 } }];
        expectedRectangles.push({ point1: { x: 0, y: 2 }, point2: { x: 0, y: 2 } });
        expectedRectangles.push({ point1: { x: 2, y: 2 }, point2: { x: 2, y: 2 } });
        expectedRectangles.push({ point1: { x: 1, y: 3 }, point2: { x: 1, y: 3 } });

        const result = differenceHandler['createRectangles'](difference);
        const length = 4;

        expect(result.rectangles.length).toEqual(length);
        expect(result.rectangles).toEqual(expectedRectangles);
    });

    it('should be 4 big rectangles', () => {
        const difference: Point[] = [];
        const expectedRectangles: Rectangle[] = [{ point1: { x: 0, y: 0 }, point2: { x: 6, y: 0 } }];
        expectedRectangles.push({ point1: { x: 0, y: 1 }, point2: { x: 1, y: 6 } });
        expectedRectangles.push({ point1: { x: 5, y: 1 }, point2: { x: 6, y: 6 } });
        expectedRectangles.push({ point1: { x: 0, y: 7 }, point2: { x: 6, y: 7 } });
        const stopper = 7;

        for (let i = 0; i < stopper; i++) {
            difference.push({ x: i, y: 0 });
        }

        for (let i = 1; i < stopper; i++) {
            difference.push({ x: 0, y: i });
            difference.push({ x: 1, y: i });
            difference.push({ x: 5, y: i });
            difference.push({ x: 6, y: i });
        }

        for (let i = 0; i < stopper; i++) {
            difference.push({ x: i, y: 7 });
        }

        const result = differenceHandler['createRectangles'](difference);
        const length = 4;

        expect(result.rectangles.length).toEqual(length);
        expect(result.rectangles).toEqual(expectedRectangles);
    });

    it('should be 3 rectangles', () => {
        let difference: Point[] = [];
        const expectedRectangles: Rectangle[] = [{ point1: { x: 0, y: 0 }, point2: { x: 4, y: 0 } }];
        expectedRectangles.push({ point1: { x: 0, y: 1 }, point2: { x: 5, y: 1 } });
        expectedRectangles.push({ point1: { x: 0, y: 2 }, point2: { x: 4, y: 2 } });
        const stopper = 5;

        for (let i = 0; i < stopper; i++) {
            difference.push({ x: i, y: 0 });
            difference.push({ x: i, y: 1 });
            difference.push({ x: i, y: 2 });
        }

        difference.push({ x: 5, y: 1 });
        difference = differenceHandler['mergeSortDifPoints'](difference);

        const result = differenceHandler['createRectangles'](difference);

        expect(result.rectangles.length).toEqual(3);
        expect(result.rectangles).toEqual(expectedRectangles);
    });

    it('should be -1', () => {
        const expectResult = -1;
        expect(differenceHandler['pointComparer']({ x: 1, y: 2 }, { x: 1, y: 3 })).toEqual(expectResult);
        expect(differenceHandler['pointComparer']({ x: 1, y: 2 }, { x: 1, y: 2 })).toEqual(expectResult);
        expect(differenceHandler['pointComparer']({ x: 0, y: 2 }, { x: 1, y: 2 })).toEqual(expectResult);
    });

    it('should be 1', () => {
        expect(differenceHandler['pointComparer']({ x: 1, y: 4 }, { x: 1, y: 3 })).toEqual(1);
        expect(differenceHandler['pointComparer']({ x: 3, y: 2 }, { x: 1, y: 2 })).toEqual(1);
    });

    it('should be sorted', () => {
        expect(
            differenceHandler['mergeSortDifPoints']([
                { x: 1, y: 4 },
                { x: 2, y: 3 },
            ]),
        ).toEqual([
            { x: 2, y: 3 },
            { x: 1, y: 4 },
        ]);
    });

    it('should not change', () => {
        expect(
            differenceHandler['mergeSortDifPoints']([
                { x: 1, y: 4 },
                { x: 2, y: 5 },
            ]),
        ).toEqual([
            { x: 1, y: 4 },
            { x: 2, y: 5 },
        ]);
    });

    it('should sort big arrays', () => {
        expect(
            differenceHandler['mergeSortDifPoints']([
                { x: 1, y: 4 },
                { x: 2, y: 5 },
                { x: 2, y: 3 },
            ]),
        ).toEqual([
            { x: 2, y: 3 },
            { x: 1, y: 4 },
            { x: 2, y: 5 },
        ]);
    });

    it('should modify image differences', () => {
        const original: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const modify: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const difference: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);

        const originalCtx: CanvasRenderingContext2D = original.getContext('2d') as CanvasRenderingContext2D;
        const modifyCtx: CanvasRenderingContext2D = modify.getContext('2d') as CanvasRenderingContext2D;
        const differenceCtx: CanvasRenderingContext2D = difference.getContext('2d') as CanvasRenderingContext2D;
        const val = 100;
        const val2 = 199;
        modifyCtx.fillRect(0, 0, val, val);
        const points: Point[] = differenceHandler.modImageDiff(0, [originalCtx, modifyCtx, differenceCtx]);

        expect(points.length).toEqual(val2);
    });

    it('should position be black', () => {
        const lastVal = 255;
        const data = new Uint8ClampedArray([0, 0, 0, lastVal]);
        const position = 0;
        const result = true;
        expect(differenceHandler['isBlack'](data, position)).toEqual(result);
    });

    it('should position be not black', () => {
        const val = 4;
        const data = new Uint8ClampedArray([val, val, val, val]);
        const position = 0;
        const result = false;
        expect(differenceHandler['isBlack'](data, position)).toEqual(result);
    });

    it('should position be not black', () => {
        const lastVal = 254;
        const data = new Uint8ClampedArray([0, 0, 0, lastVal]);
        const position = 0;
        const result = false;
        expect(differenceHandler['isBlack'](data, position)).toEqual(result);
    });

    it('should not be data different', () => {
        const lastVal = 4;
        const originalData = new Uint8ClampedArray([0, 0, 0, lastVal]);
        const changedData = new Uint8ClampedArray([0, 0, 0, lastVal]);
        const position = 0;
        const result = false;
        expect(differenceHandler['isDifferent'](originalData, changedData, position)).toEqual(result);
    });

    it('should data be different', () => {
        const lastVal = 255;
        const originalData = new Uint8ClampedArray([1, 0, 0, lastVal]);
        const changedData = new Uint8ClampedArray([0, 0, 0, lastVal]);
        const position = 0;
        const result = true;
        expect(differenceHandler['isDifferent'](originalData, changedData, position)).toEqual(result);
    });

    it('should data2 be different', () => {
        const lastVal = 255;
        const changedVal = 4;
        const originalData = new Uint8ClampedArray([changedVal, changedVal, changedVal, lastVal]);
        const changedData = new Uint8ClampedArray([0, 0, 0, lastVal]);
        const position = 0;
        const result = true;
        expect(differenceHandler['isDifferent'](originalData, changedData, position)).toEqual(result);
    });

    it('should isValid, isDifferent and xyToPos be called for isExteriorV2', () => {
        const vTest: Point = { x: 100, y: 100 };
        const lastVal = 255;
        const length = 7684; // (640 * 3 + 1) * 4
        const originalData = new Uint8ClampedArray(length);
        const changedData = new Uint8ClampedArray(length);

        for (let i = 0; i < originalData.length; i++) {
            if (i % 3 === 0) {
                originalData[i] = lastVal;
                changedData[i] = lastVal;
            } else {
                originalData[i] = 0;
                changedData[i] = 0;
            }
        }

        spyOn<PrivateFunction>(differenceHandler, 'isValidPos').and.returnValue(true);
        spyOn<PrivateFunction>(differenceHandler, 'isDifferent').and.returnValue(true);
        spyOn<PrivateFunction>(differenceHandler, 'xyToPos').and.returnValue(1);
        differenceHandler['isExteriorV2'](originalData, changedData, vTest);
        expect(differenceHandler['isValidPos']).toHaveBeenCalled();
        expect(differenceHandler['isDifferent']).toHaveBeenCalled();
        expect(differenceHandler['xyToPos']).toHaveBeenCalled();
    });

    it('should point be exterieur', () => {
        const vTest: Point = { x: 5, y: 5 };
        const lastVal = 255;
        const length = 7684; // ((640 * 3)+1)*4
        const originalData = new Uint8ClampedArray(length);
        const changedData = new Uint8ClampedArray(length);

        for (let i = 0; i < originalData.length; i++) {
            if (i % 3 === 0) {
                originalData[i] = lastVal;
                changedData[i] = lastVal;
            } else {
                originalData[i] = 0;
                changedData[i] = 0;
            }
        }
        const result = true;

        expect(differenceHandler['isExteriorV2'](originalData, changedData, vTest)).toEqual(result);
    });

    it('should not be point exterieur', () => {
        const vTest: Point = { x: 5, y: 5 };
        const lastVal = 255;
        const length = 1228800; // ((640 * 3)+1)*4
        const originalData = new Uint8ClampedArray(length);
        const changedData = new Uint8ClampedArray(length);

        for (let i = 0; i < originalData.length; i++) {
            if (i % 3 === 0) {
                originalData[i] = lastVal;
                changedData[i] = lastVal;
            } else {
                originalData[i] = 0;
                changedData[i] = 255;
            }
        }
        const result = false;

        expect(differenceHandler['isExteriorV2'](originalData, changedData, vTest)).toEqual(result);
    });

    it('should be true', () => {
        const result = 12;
        expect(differenceHandler['xyToPos'](3, 0)).toEqual(result);
    });

    it('should be 2572', () => {
        const result = 2572;
        expect(differenceHandler['xyToPos'](3, 1)).toEqual(result);
    });

    it('(0,0) should be a valid position (true)', () => {
        const x = 0;
        const y = 0;
        const result = true;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('(639,479) should be a valid position (true)', () => {
        const x = 639;
        const y = 479;
        const result = true;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('(0,479) should be a valid position (true)', () => {
        const x = 0;
        const y = 479;
        const result = true;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('(639,0) should be a valid position (true)', () => {
        const x = 639;
        const y = 0;
        const result = true;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('(34,79) should be a valid position (true)', () => {
        const x = 34;
        const y = 79;
        const result = true;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('(-1,10) should be an invalid position (false)', () => {
        const x = -1;
        const y = 10;
        const result = false;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('(10,-1) should be an invalid position (false)', () => {
        const x = 10;
        const y = -1;
        const result = false;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('(-4,-6) should be an invalid position (false)', () => {
        const x = -4;
        const y = -6;
        const result = false;
        expect(differenceHandler['isValidPos'](x, y)).toEqual(result);
    });

    it('should isValid, isBlack and xyToPos be called for getAdjacentCoordinates', () => {
        const vTest: Point = { x: 100, y: 100 };
        const lastVal = 255;
        const modulo = 4;
        const length = 1228800; // (640*480)4
        const dataOfDifferences = new Uint8ClampedArray(length);

        for (let i = 0; i < dataOfDifferences.length; i++) {
            if (i % modulo === 3) {
                dataOfDifferences[i] = lastVal;
            } else {
                dataOfDifferences[i] = 0;
            }
        }

        spyOn<PrivateFunction>(differenceHandler, 'isValidPos').and.returnValue(true);
        spyOn<PrivateFunction>(differenceHandler, 'isBlack').and.returnValue(true);
        spyOn<PrivateFunction>(differenceHandler, 'xyToPos').and.returnValue(1);
        differenceHandler['getAdjacentCoordinates'](vTest, dataOfDifferences);
        expect(differenceHandler['isValidPos']).toHaveBeenCalled();
        expect(differenceHandler['isBlack']).toHaveBeenCalled();
        expect(differenceHandler['xyToPos']).toHaveBeenCalled();
    });

    it('getAdjacentCoordinates should return 8 points', () => {
        const vTest: Point = { x: 100, y: 100 };
        const lastVal = 255;
        const length = 1228800; // (640 * 480)*4
        const dataOfDifferences = new Uint8ClampedArray(length);

        for (let i = 0; i < dataOfDifferences.length; i++) {
            dataOfDifferences[i] = 0;
        }
        // the formula used to calculate the values ​​is  (x + (640*y)) * 4 + 3
        // the points to use are (99,99)(99,100)(99,101)(100,99)(100,101)(101,99)(101,100)(101,101)
        dataOfDifferences[253839] = lastVal; // (99,99)
        dataOfDifferences[256399] = lastVal; // (99,100)
        dataOfDifferences[258959] = lastVal; // (99,101)
        dataOfDifferences[253843] = lastVal; // (100,99)

        dataOfDifferences[258963] = lastVal; // (100,101)
        dataOfDifferences[253847] = lastVal; // (101,99)
        dataOfDifferences[256407] = lastVal; // (101,100)
        dataOfDifferences[258967] = lastVal; // (101,101)
        const adjacentCoordExpected: Point[] = [
            { x: 100, y: 101 },
            { x: 100, y: 99 },
            { x: 99, y: 100 },
            { x: 101, y: 100 },
            { x: 101, y: 101 },
            { x: 99, y: 101 },
            { x: 101, y: 99 },
            { x: 99, y: 99 },
        ];

        const result = differenceHandler['getAdjacentCoordinates'](vTest, dataOfDifferences);
        expect(result.length).toEqual(adjacentCoordExpected.length);
        expect(result).toEqual(adjacentCoordExpected);
    });

    it('getAdjacentCoordinates should return 0 point', () => {
        const vTest: Point = { x: 100, y: 100 };
        const length = 1228800; // (640 * 480)*4
        const dataOfDifferences = new Uint8ClampedArray(length);

        for (let i = 0; i < dataOfDifferences.length; i++) {
            dataOfDifferences[i] = 0;
        }
        const adjacentCoordExpected: Point[] = [];

        const result = differenceHandler['getAdjacentCoordinates'](vTest, dataOfDifferences);
        expect(result.length).toEqual(adjacentCoordExpected.length);
        expect(result).toEqual(adjacentCoordExpected);
    });

    it('getAdjacentCoordinates should return 2 point', () => {
        const vTest: Point = { x: 0, y: 0 };
        const lastVal = 255;
        const length = 1228800; // (640 * 480)*4
        const dataOfDifferences = new Uint8ClampedArray(length);

        for (let i = 0; i < dataOfDifferences.length; i++) {
            dataOfDifferences[i] = 0;
        }
        dataOfDifferences[2563] = lastVal;
        dataOfDifferences[7] = lastVal;
        const adjacentCoordExpected: Point[] = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
        ];

        const result = differenceHandler['getAdjacentCoordinates'](vTest, dataOfDifferences);
        expect(result.length).toEqual(adjacentCoordExpected.length);
        expect(result).toEqual(adjacentCoordExpected);
    });
    it('should return one difference', () => {
        const difference: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const differenceCtx: CanvasRenderingContext2D = difference.getContext('2d') as CanvasRenderingContext2D;
        const val1 = 100;
        differenceCtx.fillRect(0, 0, val1, val1);
        const diffs: ImageDiffs = differenceHandler.findDifferences(differenceCtx, [{ x: 0, y: 0 }]);

        expect(diffs.differences.length).toEqual(1);
    });

    it('should return one difference', () => {
        const difference: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const differenceCtx: CanvasRenderingContext2D = difference.getContext('2d') as CanvasRenderingContext2D;
        const val1 = 10;
        const multiplicator = 20;
        const numberOfDifference = 7;
        const points: Point[] = [];
        for (let i = 0; i < numberOfDifference; i++) {
            differenceCtx.fillRect(multiplicator * i, multiplicator * i, val1, val1);
            points.push({ x: multiplicator * i, y: multiplicator * i });
        }

        const diffs: ImageDiffs = differenceHandler.findDifferences(differenceCtx, points);

        expect(diffs.differences.length).toEqual(numberOfDifference);
    });

    it('function bfs should call getAdjacentCoordinates and xyToPos', () => {
        const lastVal = 255;
        const modulo = 4;
        const vec: Point = { x: 1, y: 2 };
        const lengthData = 1228800; // (640 * 480)*4
        const lenghtVisited = 307200; // (640*480)
        const dataOfDifferences = new Uint8ClampedArray(lengthData);
        const visited: boolean[] = [];

        for (let i = 0; i < dataOfDifferences.length; i++) {
            if (i < lenghtVisited) {
                visited[i] = false;
            }
            if (i % modulo === 3) {
                dataOfDifferences[i] = lastVal;
            } else {
                dataOfDifferences[i] = 0;
            }
        }

        spyOn<PrivateFunction>(differenceHandler, 'getAdjacentCoordinates').and.returnValue([{ x: 2, y: 3 }]);
        spyOn<PrivateFunction>(differenceHandler, 'xyToPos').and.returnValue(2);
        differenceHandler['bfs'](vec, dataOfDifferences, visited);
        expect(differenceHandler['getAdjacentCoordinates']).toHaveBeenCalled();
        expect(differenceHandler['xyToPos']).toHaveBeenCalled();
    });

    it('function bfs should find one differences', () => {
        const lastVal = 255;
        const vec: Point = { x: 100, y: 100 };
        const lengthData = 1228800;

        const dataOfDifferences = new Uint8ClampedArray(lengthData);
        const visited: boolean[] = [];

        for (let i = 0; i < dataOfDifferences.length; i++) {
            dataOfDifferences[i] = 0;
        }

        dataOfDifferences[253839] = lastVal; // (99,99)
        dataOfDifferences[256399] = lastVal; // (99,100)
        dataOfDifferences[258959] = lastVal; // (99,101)
        dataOfDifferences[253843] = lastVal; // (100,99)

        dataOfDifferences[258963] = lastVal; // (100,101)
        dataOfDifferences[253847] = lastVal; // (101,99)
        dataOfDifferences[256407] = lastVal; // (101,100)
        dataOfDifferences[258967] = lastVal; // (101,101)
        const differenceObtenue = differenceHandler['bfs'](vec, dataOfDifferences, visited);
        const differenceAttendu: Point[] = [];

        differenceAttendu.push({ x: 100, y: 100 });
        differenceAttendu.push({ x: 99, y: 99 });
        differenceAttendu.push({ x: 99, y: 100 });
        differenceAttendu.push({ x: 99, y: 101 });
        differenceAttendu.push({ x: 100, y: 99 });
        differenceAttendu.push({ x: 100, y: 101 });
        differenceAttendu.push({ x: 101, y: 99 });
        differenceAttendu.push({ x: 101, y: 100 });
        differenceAttendu.push({ x: 101, y: 101 });

        expect(differenceObtenue.length).toEqual(differenceAttendu.length);
    });
});
