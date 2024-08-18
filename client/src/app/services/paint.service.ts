import { Injectable } from '@angular/core';
import { DEFAULT_HEIGHT, DEFAULT_PEN_SIZE, DEFAULT_WIDTH } from '@common/constants';
import { CanvasChanges, CanvasState, Point } from '@common/interfaces';

@Injectable({
    providedIn: 'root',
})
export class PaintService {
    color: string = '#000000';
    radius: number = DEFAULT_PEN_SIZE;

    isSquare = false;
    isRec: boolean = false;
    isErasing = false;
    startCoordinate: Point = { x: 0, y: 0 };
    endCoordinate: Point = { x: 0, y: 0 };
    currentCoordinate: Point = { x: -1, y: 0 };
    currentSquareCoordinate: Point = { x: 0, y: 0 };
    isDrawing: boolean = false;
    goodCanvas: CanvasRenderingContext2D;

    emptyCanvas(ctx: CanvasRenderingContext2D) {
        const data: ImageData = new ImageData(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        ctx.putImageData(data, 0, 0);
    }

    startErasing(ctx: CanvasRenderingContext2D, ctx2: CanvasRenderingContext2D) {
        this.isErasing = true;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,0)';
        ctx2.globalCompositeOperation = 'destination-out';
        ctx2.strokeStyle = 'rgba(0,0,0,0)';
    }

    stopErasing(ctx: CanvasRenderingContext2D, ctx2: CanvasRenderingContext2D) {
        this.isErasing = false;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = this.color;
        ctx2.globalCompositeOperation = 'source-over';
        ctx2.strokeStyle = this.color;
    }

    onMouseMove(coordinate: Point, ctx: CanvasRenderingContext2D) {
        const square = this.fromRecToSquare(this.startCoordinate, coordinate);
        if (this.isDrawing) {
            if (!this.isRec) {
                if (this.isTooFar(this.currentCoordinate, coordinate)) {
                    this.drawPath(ctx, this.currentCoordinate, coordinate);
                } else {
                    this.drawFigure(ctx, coordinate);
                }
            } else {
                this.emptyCanvas(ctx);
                this.clearRec(ctx, this.startCoordinate, this.currentCoordinate);
                if (this.isSquare) {
                    this.drawRec(ctx, this.startCoordinate, square);
                } else {
                    this.drawRec(ctx, this.startCoordinate, coordinate);
                }
            }
        }
        this.currentCoordinate = coordinate;
        this.currentSquareCoordinate = square;
    }

    onMouseDown(point: Point, ctx: CanvasRenderingContext2D) {
        this.goodCanvas = ctx;
        if (!this.isRec) {
            this.drawFigure(ctx, point);
        } else {
            this.startCoordinate = point;
        }
        this.isDrawing = true;
        this.currentCoordinate = point;
    }

    onMouseUp(coordinate: Point, ctx: CanvasRenderingContext2D) {
        const square = this.fromRecToSquare(this.startCoordinate, coordinate);
        if (this.isRec && ctx === this.goodCanvas) {
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;
            if (this.isSquare) {
                this.drawRec(ctx, this.startCoordinate, square);
            } else {
                this.drawRec(ctx, this.startCoordinate, coordinate);
            }
        }
    }

    undo(changes: CanvasChanges, canvasOriginal: CanvasRenderingContext2D, canvasModified: CanvasRenderingContext2D) {
        if (changes.past.length > 1) {
            const imgData: CanvasState = changes.past.pop() as CanvasState;
            changes.next.push(imgData);
            canvasOriginal.putImageData(changes.past[changes.past.length - 1].context1, 0, 0);
            canvasModified.putImageData(changes.past[changes.past.length - 1].context2, 0, 0);
        }
    }

    redo(changes: CanvasChanges, canvasOriginal: CanvasRenderingContext2D, canvasModified: CanvasRenderingContext2D) {
        if (changes.next.length > 0) {
            const imgData: CanvasState = changes.next.pop() as CanvasState;
            changes.past.push(imgData);
            canvasOriginal.putImageData(changes.past[changes.past.length - 1].context1, 0, 0);
            canvasModified.putImageData(changes.past[changes.past.length - 1].context2, 0, 0);
        }
    }

    duplicate(toDuplicate: CanvasRenderingContext2D, duplicated: CanvasRenderingContext2D) {
        const imgData: ImageData = toDuplicate.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        duplicated.putImageData(imgData, 0, 0);
    }

    invert(ctx1: CanvasRenderingContext2D, ctx2: CanvasRenderingContext2D) {
        const imgData1: ImageData = ctx1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const imgData2: ImageData = ctx2.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        ctx2.putImageData(imgData1, 0, 0);
        ctx1.putImageData(imgData2, 0, 0);
    }

    isEmpty(canvas: HTMLCanvasElement): boolean {
        const empty = document.createElement('canvas');

        empty.width = canvas.width;
        empty.height = canvas.height;

        return canvas.toDataURL() === empty.toDataURL();
    }

    isEqual(canvas: HTMLCanvasElement, canvas2: HTMLCanvasElement): boolean {
        return canvas.toDataURL() === canvas2.toDataURL();
    }

    private getNorm(start: Point, current: Point) {
        return Math.sqrt(Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2));
    }

    private isTooFar(start: Point, current: Point): boolean {
        return this.getNorm(start, current) > this.radius / 2;
    }

    private drawFigure(ctx: CanvasRenderingContext2D, point: Point) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.moveTo(point.x, point.y);
        ctx.lineWidth = this.radius;
        if (this.isErasing) {
            ctx.fillRect(point.x - this.radius, point.y - this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.arc(point.x, point.y, this.radius / 2, 0, 2 * Math.PI);
        }
        ctx.stroke();
        ctx.fill();
    }

    private drawPath(ctx: CanvasRenderingContext2D, point: Point, currentCoordinate: Point) {
        const noSense = -1;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.moveTo(point.x, point.y);
        ctx.lineWidth = this.radius * 2;
        if (this.isErasing) {
            ctx.lineCap = 'square';
        } else {
            ctx.lineCap = 'round';
        }
        if (!(this.currentCoordinate.x === noSense)) {
            ctx.lineTo(currentCoordinate.x, currentCoordinate.y);
        }
        ctx.stroke();
        ctx.fill();
    }

    private fromRecToSquare(startPoint: Point, currentPoint: Point): Point {
        const xDiff = currentPoint.x - startPoint.x;
        const yDiff = currentPoint.y - startPoint.y;
        return Math.abs(xDiff) < Math.abs(yDiff)
            ? { x: currentPoint.x, y: (yDiff / Math.abs(yDiff)) * Math.abs(xDiff) + this.startCoordinate.y }
            : { x: (xDiff * Math.abs(yDiff)) / Math.abs(xDiff) + this.startCoordinate.x, y: currentPoint.y };
    }

    private clearRec(ctx: CanvasRenderingContext2D, startPoint: Point, currentPoint: Point) {
        ctx.beginPath();
        ctx.clearRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
        ctx.stroke();
    }

    private drawRec(ctx: CanvasRenderingContext2D, point: Point, currentPoint: Point) {
        ctx.beginPath();
        ctx.fillRect(point.x, point.y, currentPoint.x - point.x, currentPoint.y - point.y);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.fill();
    }
}
