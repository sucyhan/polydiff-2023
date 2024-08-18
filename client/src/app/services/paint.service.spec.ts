import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@common/constants';
import { Point, PrivateFunction } from '@common/interfaces';
import { PaintService } from './paint.service';

describe('PaintService', () => {
    let service: PaintService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PaintService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('emptyCanvas should put emptyImageData on canvas', () => {
        spyOn(CanvasRenderingContext2D.prototype, 'putImageData');
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const imageData = canvasCtx.createImageData(1, 1);
        service.emptyCanvas(canvasCtx);
        expect(canvasCtx.getImageData(0, 0, 1, 1)).toEqual(imageData);
        expect(canvasCtx.putImageData).toHaveBeenCalled();
    });

    it('startErasing should set globalCompositeOperation to destination-out', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;
        service.startErasing(ctx, ctx2);
        expect(ctx.globalCompositeOperation).toEqual('destination-out');
        expect(ctx2.globalCompositeOperation).toEqual('destination-out');
    });

    it('startErasing should set strokeStyle to rgba(0, 0, 0, 0)', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;
        service.startErasing(ctx, ctx2);
        expect(ctx.strokeStyle).toEqual('rgba(0, 0, 0, 0)');
        expect(ctx2.strokeStyle).toEqual('rgba(0, 0, 0, 0)');
    });

    it('stopErasing should set globalCompositeOperation to source-over', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;
        service.stopErasing(ctx, ctx2);
        expect(ctx.globalCompositeOperation).toEqual('source-over');
        expect(ctx2.globalCompositeOperation).toEqual('source-over');
    });

    it('stopErasing should set strokeStyle to color', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;
        service.stopErasing(ctx, ctx2);
        expect(ctx.strokeStyle).toEqual(service.color);
        expect(ctx2.strokeStyle).toEqual(service.color);
    });

    it('onMouseMove should set currentCoordinate to coordinate and currentSquareCoordinate to squareCoordinate', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const coordinate: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'fromRecToSquare').and.returnValue({ x: 0, y: 0 });
        service.onMouseMove(coordinate, ctx);
        expect(service.currentCoordinate).toEqual(coordinate);
        expect(service.currentSquareCoordinate).toEqual({ x: 0, y: 0 });
    });

    it('onMouseMove should not call drawPath, clearRec or drawRec if isDrawing is false', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const coordinate: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'drawPath').and.returnValue(null);
        spyOn<PrivateFunction>(service, 'clearRec').and.returnValue(null);
        spyOn<PrivateFunction>(service, 'drawRec').and.returnValue(null);
        service.isDrawing = false;
        service.onMouseMove(coordinate, ctx);
        expect(service['drawPath']).not.toHaveBeenCalled();
        expect(service['clearRec']).not.toHaveBeenCalled();
        expect(service['drawRec']).not.toHaveBeenCalled();
    });

    it('onMouseMove should call clearRec if isRec is true and isDrawing is true', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const coordinate: Point = { x: 0, y: 0 };
        service.startCoordinate = coordinate;
        service.currentCoordinate = coordinate;
        spyOn<PrivateFunction>(service, 'drawPath').and.returnValue(null);
        spyOn<PrivateFunction>(service, 'clearRec').and.returnValue(null);
        spyOn<PrivateFunction>(service, 'drawRec').and.returnValue(null);
        spyOn<PrivateFunction>(service, 'fromRecToSquare').and.returnValue({ x: 0, y: 0 });
        service.isRec = true;
        service.isDrawing = true;
        service.onMouseMove(coordinate, ctx);
        expect(service['drawPath']).not.toHaveBeenCalled();
        expect(service['clearRec']).toHaveBeenCalledWith(ctx, service.startCoordinate, service.currentCoordinate);
    });

    it('onMouseMove should call isTooFar and drawFigure', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        service.isDrawing = true;
        service.isRec = false;
        service.currentCoordinate = { x: 0, y: 1 };
        const spyOnIsTooFar = spyOn<PrivateFunction>(service, 'isTooFar');
        const spyOnDrawFigure = spyOn<PrivateFunction>(service, 'drawFigure');
        service.onMouseMove(point, canvasCtx);
        expect(spyOnIsTooFar).toHaveBeenCalled();
        expect(spyOnDrawFigure).toHaveBeenCalled();
    });

    it('onMouseMove should call isTooFar and drawPath', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        service.isDrawing = true;
        service.isRec = false;
        service.currentCoordinate = { x: 100, y: 100 };

        const spyOnIsTooFar = spyOn<PrivateFunction>(service, 'isTooFar').and.callThrough();
        const spyOnDrawFigure = spyOn<PrivateFunction>(service, 'drawPath').and.callThrough();
        service.onMouseMove(point, canvasCtx);
        expect(spyOnIsTooFar).toHaveBeenCalled();
        expect(spyOnDrawFigure).toHaveBeenCalled();
    });

    it('onMouseMove should call drawRec', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        service.isDrawing = true;
        service.isRec = true;
        service.isSquare = true;
        service.currentCoordinate = { x: 100, y: 100 };

        const spyOnDrawRec = spyOn<PrivateFunction>(service, 'drawRec').and.callThrough();
        service.onMouseMove(point, canvasCtx);
        expect(spyOnDrawRec).toHaveBeenCalled();
    });

    it('onMouseDown should set isDrawing to true, goodCanvas to ctx and currentCoordinate to point', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        service.onMouseDown(point, ctx);
        expect(service.isDrawing).toBeTrue();
        expect(service.goodCanvas).toEqual(ctx);
        expect(service.currentCoordinate).toEqual(point);
    });

    it('onMouseDown should call drawFigure if isRec is false', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'drawFigure').and.returnValue(null);
        service.isRec = false;
        service.onMouseDown(point, ctx);
        expect(service['drawFigure']).toHaveBeenCalledWith(ctx, point);
    });

    it('onMouseDown should not call drawFigure if isRec is true and set startCoordinate to point', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'drawFigure').and.returnValue(null);
        service.isRec = true;
        service.onMouseDown(point, ctx);
        expect(service['drawFigure']).not.toHaveBeenCalled();
        expect(service.startCoordinate).toEqual(point);
    });

    it('onMouseUp should call fromRecToSquare with startCoordinate and coordinate', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'fromRecToSquare').and.returnValue({ x: 0, y: 0 });
        service.onMouseUp(point, ctx);
        expect(service['fromRecToSquare']).toHaveBeenCalledWith(service.startCoordinate, point);
    });

    it('onMouseUp should set fillStyle to color and strokeStyle to color if isRec is true and ctx equals goodCanvas', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ff0000';
        const point: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'fromRecToSquare').and.returnValue({ x: 0, y: 0 });
        service.isRec = true;
        service.goodCanvas = ctx;
        service.onMouseUp(point, ctx);
        expect(ctx.fillStyle).toEqual(service.color);
        expect(ctx.strokeStyle).toEqual(service.color);
        expect(ctx.fillStyle).not.toEqual('#ff0000');
        expect(ctx.strokeStyle).not.toEqual('#ff0000');
    });

    it('onMouseUp should not set fillStyle to color and strokeStyle to color if isRec is false and ctx is not equal to goodCanvas', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ff0000';
        const point: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'fromRecToSquare').and.returnValue({ x: 0, y: 0 });
        service.isRec = false;
        service.onMouseUp(point, ctx);
        expect(ctx.fillStyle).not.toEqual(service.color);
        expect(ctx.strokeStyle).not.toEqual(service.color);
        expect(ctx.fillStyle).toEqual('#ff0000');
        expect(ctx.strokeStyle).toEqual('#ff0000');
    });

    it('onMouseUp should call drawRec with ctx, startCoordinate and coordinate if isSquare is false', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'fromRecToSquare').and.returnValue({ x: 0, y: 0 });
        spyOn<PrivateFunction>(service, 'drawRec').and.returnValue(null);
        service.isSquare = false;
        service.isRec = true;
        service.goodCanvas = ctx;
        service.onMouseUp(point, ctx);
        expect(service['drawRec']).toHaveBeenCalledWith(ctx, service.startCoordinate, point);
    });

    it('onMouseUp should call drawRec with ctx, startCoordinate and coordinate if isSquare is true', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 0, y: 0 };
        spyOn<PrivateFunction>(service, 'fromRecToSquare').and.returnValue({ x: 5, y: 5 });
        const square: Point = { x: 5, y: 5 };
        spyOn<PrivateFunction>(service, 'drawRec').and.returnValue(null);
        service.isSquare = true;
        service.isRec = true;
        service.goodCanvas = ctx;
        service.onMouseUp(point, ctx);
        expect(service['drawRec']).toHaveBeenCalledWith(ctx, service.startCoordinate, square);
    });

    it('undo should not call putImageData if changes.past.length is not bigger than 1', () => {
        const canvasO: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctxO: CanvasRenderingContext2D = canvasO.getContext('2d') as CanvasRenderingContext2D;
        const canvasM: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctxM: CanvasRenderingContext2D = canvasM.getContext('2d') as CanvasRenderingContext2D;
        spyOn(ctxO, 'putImageData').and.returnValue();
        spyOn(ctxM, 'putImageData').and.returnValue();
        const changes = { past: [], next: [] };
        service.undo(changes, ctxO, ctxM);
        expect(ctxO.putImageData).not.toHaveBeenCalled();
        expect(ctxM.putImageData).not.toHaveBeenCalled();
    });

    it("undo should restore the previous state of the canvas and move it to the 'next' array", () => {
        const initValue = 10;
        const changes = {
            past: [
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // initial state
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // previous state
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // current state
            ],
            next: [],
        };

        const canvasOriginal: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasOriginalCtx: CanvasRenderingContext2D = canvasOriginal.getContext('2d') as CanvasRenderingContext2D;

        const canvasModified: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasModifiedCtx: CanvasRenderingContext2D = canvasModified.getContext('2d') as CanvasRenderingContext2D;

        service.undo(changes, canvasOriginalCtx, canvasModifiedCtx);
        expect(changes.past.length).toEqual(2);
        expect(changes.next.length).toEqual(1);
        expect(changes.next[0]).toEqual({ context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) });
        expect(canvasOriginalCtx.getImageData(0, 0, initValue, initValue)).toEqual(new ImageData(initValue, initValue));
        expect(canvasModifiedCtx.getImageData(0, 0, initValue, initValue)).toEqual(new ImageData(initValue, initValue));
    });

    it("undo should restore the previous state of the canvas and move multiple states to the 'next' array", () => {
        const initValue = 10;
        const changes = {
            past: [
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // initial state
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // previous state 1
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // previous state 2
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // current state
            ],
            next: [],
        };

        const canvasOriginal: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasOriginalCtx: CanvasRenderingContext2D = canvasOriginal.getContext('2d') as CanvasRenderingContext2D;

        const canvasModified: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasModifiedCtx: CanvasRenderingContext2D = canvasModified.getContext('2d') as CanvasRenderingContext2D;

        service.undo(changes, canvasOriginalCtx, canvasModifiedCtx);
        service.undo(changes, canvasOriginalCtx, canvasModifiedCtx);
        expect(changes.past.length).toEqual(2);
        expect(changes.next.length).toEqual(2);
        expect(changes.next[0]).toEqual({ context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) });
        expect(changes.next[1]).toEqual({ context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) });
        expect(canvasOriginalCtx.getImageData(0, 0, initValue, initValue)).toEqual(new ImageData(initValue, initValue));
        expect(canvasModifiedCtx.getImageData(0, 0, initValue, initValue)).toEqual(new ImageData(initValue, initValue));
    });

    it("undo should do nothing if there is only one state in the 'past' array", () => {
        const initValue = 10;
        const changes = {
            past: [
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // initial state
            ],
            next: [],
        };
        const canvasOriginal: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasOriginalCtx: CanvasRenderingContext2D = canvasOriginal.getContext('2d') as CanvasRenderingContext2D;

        const canvasModified: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasModifiedCtx: CanvasRenderingContext2D = canvasModified.getContext('2d') as CanvasRenderingContext2D;

        const initialState = JSON.stringify(changes.past);
        service.undo(changes, canvasOriginalCtx, canvasModifiedCtx);
        expect(JSON.stringify(changes.past)).toEqual(initialState);
        expect(changes.next.length).toEqual(0);
        expect(canvasOriginalCtx.getImageData(0, 0, initValue, initValue).data).toEqual(changes.past[0].context1.data);
        expect(canvasModifiedCtx.getImageData(0, 0, initValue, initValue).data).toEqual(changes.past[0].context2.data);
    });

    it('redo should not call putImageData if changes.next.length is not bigger than 0', () => {
        const canvasO: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctxO: CanvasRenderingContext2D = canvasO.getContext('2d') as CanvasRenderingContext2D;
        const canvasM: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctxM: CanvasRenderingContext2D = canvasM.getContext('2d') as CanvasRenderingContext2D;
        spyOn(ctxO, 'putImageData').and.returnValue();
        spyOn(ctxM, 'putImageData').and.returnValue();
        const changes = { past: [], next: [] };
        service.redo(changes, ctxO, ctxM);
        expect(ctxO.putImageData).not.toHaveBeenCalled();
        expect(ctxM.putImageData).not.toHaveBeenCalled();
    });

    it("redo should do nothing if the 'next' array is empty", () => {
        const initValue = 10;
        const changes = {
            past: [
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // initial state
            ],
            next: [],
        };

        const canvas1: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx1: CanvasRenderingContext2D = canvas1.getContext('2d') as CanvasRenderingContext2D;

        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;

        const initialState = JSON.stringify(changes.past);
        service.redo(changes, canvasCtx1, canvasCtx2);
        expect(JSON.stringify(changes.past)).toEqual(initialState);
        expect(changes.next.length).toEqual(0);
        expect(canvasCtx1.getImageData(0, 0, initValue, initValue).data).toEqual(changes.past[0].context1.data);
        expect(canvasCtx2.getImageData(0, 0, initValue, initValue).data).toEqual(changes.past[0].context2.data);
    });

    it("redo should restore the next state and move it to the 'past' array", () => {
        const initValue = 10;
        const changes = {
            past: [
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) }, // initial state
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) },
            ],
            next: [
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) },
                { context1: new ImageData(initValue, initValue), context2: new ImageData(initValue, initValue) },
            ],
        };

        const canvas1: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx1: CanvasRenderingContext2D = canvas1.getContext('2d') as CanvasRenderingContext2D;

        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;
        const nextState = JSON.stringify(changes.next[changes.next.length - 1]);
        service.redo(changes, canvasCtx1, canvasCtx2);
        expect(changes.past.length).toEqual(3);
        expect(JSON.stringify(changes.past[changes.past.length - 1])).toEqual(nextState);
        expect(changes.next.length).toEqual(1);
        expect(canvasCtx1.getImageData(0, 0, initValue, initValue).data).toEqual(changes.past[changes.past.length - 1].context1.data);
        expect(canvasCtx2.getImageData(0, 0, initValue, initValue).data).toEqual(changes.past[changes.past.length - 1].context2.data);
    });

    it('duplicate should put toDuplicate imageData to duplicated canvas', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const duplicated: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const toDuplicate: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;

        toDuplicate.fillRect(0, 0, 1, 1);
        spyOn(duplicated, 'putImageData').and.returnValue();
        const imgData = new ImageData(1, 1);
        spyOn(toDuplicate, 'getImageData').and.returnValue(imgData);
        service.duplicate(toDuplicate, duplicated);
        expect(duplicated.putImageData).toHaveBeenCalled();
        expect(toDuplicate.getImageData).toHaveBeenCalledWith(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    });

    it('invert should invert the contents of two canvases', () => {
        const dimension1 = 100;
        const gap = 4;
        const whiteValue = 255;
        const canvas1: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx1: CanvasRenderingContext2D = canvas1.getContext('2d') as CanvasRenderingContext2D;

        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D;

        canvasCtx1.fillStyle = 'white';
        canvasCtx1.fillRect(0, 0, dimension1, dimension1);

        canvasCtx2.fillStyle = 'black';
        canvasCtx2.fillRect(0, 0, dimension1, dimension1);

        service.invert(canvasCtx1, canvasCtx2);

        const imgData1 = canvasCtx1.getImageData(0, 0, dimension1, dimension1).data;
        const imgData2 = canvasCtx2.getImageData(0, 0, dimension1, dimension1).data;

        for (let i = 0; i < imgData1.length; i += gap) {
            expect(imgData1[i]).toBe(0);
            expect(imgData2[i]).toBe(whiteValue);
        }
    });

    it('isEmpty should return true if canvas is empty', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        expect(service.isEmpty(canvas)).toBeTrue();
    });

    it('isEmpty should return false if canvas is not empty', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.fillRect(0, 0, 1, 1);
        expect(service.isEmpty(canvas)).toBeFalse();
    });

    it('isEqual should return true if canvas are equal', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvas2: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        expect(service.isEqual(canvas, canvas2)).toBeTrue();
    });

    it('isEqual should return false if canvas are not equal', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.fillRect(0, 0, 1, 1);
        const canvas2 = document.createElement('canvas');
        expect(service.isEqual(canvas, canvas2)).toBeFalse();
    });

    it('getNorm should getNorm return the good norm', () => {
        const startPoint: Point = { x: 30, y: 5 };
        const finishPoint: Point = { x: 10, y: 5 };
        const tool = new PaintService();
        const expectedNorm = 20;

        expect(tool['getNorm'](startPoint, finishPoint)).toEqual(expectedNorm);
    });

    it('isTooFar should call getnorm', () => {
        const tool = new PaintService();
        const getNormSpyOn = spyOn<PrivateFunction>(tool, 'isTooFar');
        const startPoint: Point = { x: 30, y: 5 };
        const finishPoint: Point = { x: 10, y: 5 };
        tool['isTooFar'](startPoint, finishPoint);
        expect(getNormSpyOn).toHaveBeenCalled();
    });

    it('isTooFar should return true for two far point', () => {
        const tool = new PaintService();
        const startPoint: Point = { x: 0, y: 0 };
        const finishPoint: Point = { x: 0, y: 7 };
        const isIndeedTofar = tool['isTooFar'](startPoint, finishPoint);
        expect(isIndeedTofar).toBeTrue();
    });

    it('isTooFar should return false for two close point', () => {
        const tool = new PaintService();
        const startPoint: Point = { x: 0, y: 0 };
        const finishPoint: Point = { x: 0, y: 5 };
        const isIndeedTofar = tool['isTooFar'](startPoint, finishPoint);
        expect(isIndeedTofar).toBeFalse();
    });

    it('isTooFar should return false for two close point', () => {
        const tool = new PaintService();
        const startPoint: Point = { x: 0, y: 0 };
        const finishPoint: Point = { x: 0, y: 6 };
        const isIndeedTofar = tool['isTooFar'](startPoint, finishPoint);
        expect(isIndeedTofar).toBeFalse();
    });

    it('drawFigure should draw a circle when isErasing is false', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

        spyOn(context, 'arc');

        const point: Point = { x: 10, y: 20 };
        service.isErasing = false;
        service['drawFigure'](context, point);

        expect(context.arc).toHaveBeenCalled();
    });

    it('drawFigure should draw a square when isErasing is true', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        spyOn(context, 'fillRect');

        const point: Point = { x: 30, y: 40 };
        service.isErasing = true;
        service['drawFigure'](context, point);

        expect(context.fillRect).toHaveBeenCalled();
    });

    it('drawFigure should set the fillStyle and strokeStyle to the selected color', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

        const point: Point = { x: 50, y: 60 };
        service.color = '#ff0000';
        service['drawFigure'](context, point);

        expect(context.fillStyle).toBe('#ff0000');
        expect(context.strokeStyle).toBe('#ff0000');
    });

    it('drawFigure should set the lineWidth to the selected radius', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point: Point = { x: 70, y: 80 };
        service.radius = 5;
        service['drawFigure'](context, point);

        expect(context.lineWidth).toBe(service.radius);
    });

    it('drawPath should not throw an error if all arguments are valid', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const startPoint = { x: 10, y: 20 };
        const currentCoordinate = { x: 30, y: 40 };
        const tool = new PaintService();

        expect(() => tool['drawPath'](context, startPoint, currentCoordinate)).not.toThrow();
    });

    it('drawPath should not throw an error if currentCoordinate.x has default value', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const startPoint = { x: 10, y: 20 };
        const currentCoordinate = { x: -1, y: 40 };
        const tool = new PaintService();

        expect(() => tool['drawPath'](context, startPoint, currentCoordinate)).not.toThrow();
    });

    it('drawPath should draw a square line when erasing', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const point = { x: 0, y: 0 };
        const currentCoordinate = { x: 10, y: 10 };
        const tool = new PaintService();
        tool.isErasing = true;
        tool['drawPath'](context, point, currentCoordinate);

        expect(context.lineCap).toEqual('square');
    });

    it('drawPath should call the function lineto of context if currentcoordinate is valid ', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        service.currentCoordinate = { x: 1, y: 1 };
        const point: Point = { x: 0, y: 0 };
        const currentCoordinate: Point = { x: 1, y: 0 };
        const lineToSpyOn = spyOn(canvasCtx, 'lineTo').and.callThrough();
        service['drawPath'](canvasCtx, point, currentCoordinate);
        expect(lineToSpyOn).toHaveBeenCalled();
    });

    it('fromRecToSquare should return the good point (x)', () => {
        const startPoint: Point = { x: 0, y: 0 };
        const currentPoint: Point = { x: 10, y: 5 };
        const tool = new PaintService();
        const finalPointExpected: Point = { x: 5, y: 5 };
        const pointRetuned: Point = tool['fromRecToSquare'](startPoint, currentPoint);
        expect(pointRetuned.x).toEqual(finalPointExpected.x);
        expect(pointRetuned.y).toEqual(finalPointExpected.y);
    });

    it('fromRecToSquare should return the good point (y)', () => {
        const startPoint: Point = { x: 0, y: 0 };
        const currentPoint: Point = { x: 5, y: 10 };
        const tool = new PaintService();
        const finalPointExpected: Point = { x: 5, y: 5 };
        const pointRetuned: Point = tool['fromRecToSquare'](startPoint, currentPoint);
        expect(pointRetuned.x).toEqual(finalPointExpected.x);
        expect(pointRetuned.y).toEqual(finalPointExpected.y);
    });

    it('clearRec should call beginPath, clearRect and stroke on context', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasCtx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        spyOn(canvasCtx, 'beginPath').and.returnValue();
        spyOn(canvasCtx, 'clearRect').and.returnValue();
        spyOn(canvasCtx, 'stroke').and.returnValue();
        const startPoint: Point = { x: 0, y: 0 };
        const currentPoint: Point = { x: 10, y: 1 };
        service['clearRec'](canvasCtx, startPoint, currentPoint);
        expect(canvasCtx.beginPath).toHaveBeenCalled();
        expect(canvasCtx.clearRect).toHaveBeenCalledWith(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
        expect(canvasCtx.stroke).toHaveBeenCalled();
    });
});
