// mergeSort source: https://stackblitz.com/edit/typescript-mergesort?file=mergeSort.ts
import { Injectable } from '@angular/core';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@common/constants';
import { Difference, ImageDiffs, Point } from '@common/interfaces';

@Injectable({
    providedIn: 'root',
})
export class DifferenceHandlerService {
    getRecs(differences: Point[][]): Difference[] {
        const difRecs: Difference[] = [];

        for (const diff of differences) {
            difRecs.push(this.createRectangles(this.mergeSortDifPoints(diff)));
        }

        return difRecs;
    }

    modImageDiff(radius: number, contexts: CanvasRenderingContext2D[]): Point[] {
        const originalData = contexts[0].getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const modifiedData = contexts[1].getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const myImageData = contexts[1].createImageData(modifiedData);
        const advance = 4;
        let x = 0;
        let y = 0;
        contexts[2].beginPath();
        contexts[2].fillStyle = 'rgba(0, 0, 0, 255)';
        const points: Point[] = [];

        for (let i = 0; i < originalData.data.length; i += advance) {
            if (this.isDifferent(originalData.data, modifiedData.data, i)) {
                myImageData.data[i + 0] = 0;
                myImageData.data[i + 1] = 0;
                myImageData.data[i + 2] = 0;
                myImageData.data[i + 3] = 255;
                if (this.isExteriorV2(originalData.data, modifiedData.data, { x, y })) {
                    points.push({ x, y });
                    this.broadPoint({ x, y }, radius, contexts[2]);
                }
            } else {
                myImageData.data[i + 0] = 255;
                myImageData.data[i + 1] = 255;
                myImageData.data[i + 2] = 255;
                myImageData.data[i + 3] = 255;
            }

            x++;
            if (x >= originalData.width) {
                x = 0;
                y++;
            }
        }

        contexts[2].putImageData(myImageData, 0, 0);
        contexts[2].stroke();
        contexts[2].fill();
        return points;
    }

    findDifferences(context: CanvasRenderingContext2D, points: Point[]): ImageDiffs {
        const imgDiff: ImageDiffs = { differences: [], difficulty: 'Facile' };
        const data = context.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const visited: boolean[] = [];
        let counter = 0;
        const difficult = 7;
        const hundred = 100;
        const compare = 15;

        for (const point of points) {
            if (this.isBlack(data.data, this.xyToPos(point.x, point.y)) && !visited[this.xyToPos(point.x, point.y)]) {
                const diff: Point[] = this.bfs({ x: point.x, y: point.y }, data.data, visited);
                counter += diff.length;
                imgDiff.differences.push(diff);
            }
        }

        if (imgDiff.differences.length >= difficult && (counter / (DEFAULT_WIDTH * DEFAULT_HEIGHT)) * hundred <= compare) {
            imgDiff.difficulty = 'Difficile';
        }
        return imgDiff;
    }

    pointComparer(vec1: Point, vec2: Point): number {
        const result = -1;

        if (vec1.y > vec2.y || (vec1.y === vec2.y && vec1.x > vec2.x)) {
            return 1;
        }

        return result;
    }

    private createRectangles(points: Point[]): Difference {
        const difference: Difference = { rectangles: [] };
        let currentRectangle = 0;
        const lines: Difference = this.createLines(points);
        difference.rectangles.push(lines.rectangles[0]);

        for (let i = 1; i < lines.rectangles.length; i++) {
            if (
                lines.rectangles[i].point1.x === difference.rectangles[currentRectangle].point1.x &&
                lines.rectangles[i].point2.x === difference.rectangles[currentRectangle].point2.x
            ) {
                difference.rectangles[currentRectangle].point2.y = lines.rectangles[i].point2.y;
            } else if (
                currentRectangle > 0 &&
                lines.rectangles[i].point1.x === difference.rectangles[currentRectangle - 1].point1.x &&
                lines.rectangles[i].point2.x === difference.rectangles[currentRectangle - 1].point2.x &&
                difference.rectangles[currentRectangle].point1.y === difference.rectangles[currentRectangle - 1].point1.y
            ) {
                difference.rectangles[currentRectangle - 1].point2.y = lines.rectangles[i].point2.y;
            } else {
                currentRectangle++;
                difference.rectangles.push(lines.rectangles[i]);
            }
        }

        return difference;
    }

    private createLines(difference: Point[]): Difference {
        const lines: Difference = { rectangles: [] };
        let currentLine = 0;
        lines.rectangles.push({ point1: { x: difference[0].x, y: difference[0].y }, point2: { x: difference[0].x, y: difference[0].y } });

        for (let i = 1; i < difference.length; i++) {
            if (difference[i].y === lines.rectangles[currentLine].point2.y && difference[i].x - difference[i - 1].x === 1) {
                lines.rectangles[currentLine].point2.x = difference[i].x;
            } else {
                currentLine++;
                lines.rectangles.push({ point1: { x: difference[i].x, y: difference[i].y }, point2: { x: difference[i].x, y: difference[i].y } });
            }
        }

        return lines;
    }

    private mergeSortDifPoints(array: Point[]): Point[] {
        if (array.length <= 1) {
            return array;
        }
        const mid = Math.floor(array.length / 2);
        return this.merge(this.mergeSortDifPoints(array.slice(0, mid)), this.mergeSortDifPoints(array.slice(mid)));
    }

    private merge(left: Point[], right: Point[]): Point[] {
        const mergeArr = [];
        let i = 0;
        let j = 0;
        const minimum = -1;

        while (i < left.length && j < right.length) {
            if (this.pointComparer(left[i], right[j]) === minimum) mergeArr.push(left[i++]);
            else mergeArr.push(right[j++]);
        }
        return mergeArr.concat(left.slice(i)).concat(right.slice(j));
    }

    private broadPoint(point: Point, radius: number, context: CanvasRenderingContext2D) {
        context.moveTo(point.x + radius, point.y);
        context.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    }

    private isBlack(data: Uint8ClampedArray, pos: number): boolean {
        const full = 255;
        return data[pos + 0] === 0 && data[pos + 1] === 0 && data[pos + 2] === 0 && data[pos + 3] === full;
    }

    private isDifferent(originalData: Uint8ClampedArray, modifiedData: Uint8ClampedArray, i: number) {
        return (
            originalData[i + 0] !== modifiedData[i + 0] ||
            originalData[i + 1] !== modifiedData[i + 1] ||
            originalData[i + 2] !== modifiedData[i + 2] ||
            originalData[i + 3] !== modifiedData[i + 3]
        );
    }

    private isExteriorV2(originalData: Uint8ClampedArray, modifiedData: Uint8ClampedArray, vec: Point) {
        let result = false;
        const toValid: Point[] = [];

        toValid.push({ x: vec.x, y: vec.y + 1 });
        toValid.push({ x: vec.x, y: vec.y - 1 });
        toValid.push({ x: vec.x - 1, y: vec.y });
        toValid.push({ x: vec.x + 1, y: vec.y });
        toValid.push({ x: vec.x + 1, y: vec.y + 1 });
        toValid.push({ x: vec.x - 1, y: vec.y + 1 });
        toValid.push({ x: vec.x + 1, y: vec.y - 1 });
        toValid.push({ x: vec.x - 1, y: vec.y - 1 });

        for (const vec2 of toValid) {
            if (this.isValidPos(vec2.x, vec2.y) && !this.isDifferent(originalData, modifiedData, this.xyToPos(vec2.x, vec2.y))) {
                result = true;
                break;
            }
        }

        return result;
    }

    private xyToPos(x: number, y: number): number {
        const advancer = 4;
        return (x + DEFAULT_WIDTH * y) * advancer;
    }

    private isValidPos(x: number, y: number) {
        return !(x < 0 || x > DEFAULT_WIDTH - 1 || y < 0 || y > DEFAULT_HEIGHT - 1);
    }

    private getAdjacentCoordinates(coordinate: Point, data: Uint8ClampedArray): Point[] {
        const adjacentCoordinates: Point[] = [];
        const toValid: Point[] = [];

        toValid.push({ x: coordinate.x, y: coordinate.y + 1 });
        toValid.push({ x: coordinate.x, y: coordinate.y - 1 });
        toValid.push({ x: coordinate.x - 1, y: coordinate.y });
        toValid.push({ x: coordinate.x + 1, y: coordinate.y });
        toValid.push({ x: coordinate.x + 1, y: coordinate.y + 1 });
        toValid.push({ x: coordinate.x - 1, y: coordinate.y + 1 });
        toValid.push({ x: coordinate.x + 1, y: coordinate.y - 1 });
        toValid.push({ x: coordinate.x - 1, y: coordinate.y - 1 });

        for (const point of toValid) {
            if (this.isValidPos(point.x, point.y) && this.isBlack(data, this.xyToPos(point.x, point.y))) {
                adjacentCoordinates.push(point);
            }
        }

        return adjacentCoordinates;
    }

    private bfs(vec: Point, data: Uint8ClampedArray, visited: boolean[]) {
        const difference: Point[] = [];
        const tab: Point[] = [];
        const startPoint: Point = vec;
        tab.push(startPoint);
        visited[this.xyToPos(vec.x, vec.y)] = true;
        difference.push(startPoint);
        let currentPosition: Point = vec;

        while (tab.length > 0) {
            currentPosition = tab.pop() as Point;
            const adjacent: Point[] = this.getAdjacentCoordinates(currentPosition, data);

            for (const coord of adjacent) {
                if (!visited[this.xyToPos(coord.x, coord.y)]) {
                    visited[this.xyToPos(coord.x, coord.y)] = true;
                    tab.push(coord);
                    difference.push(coord);
                }
            }
        }
        return difference;
    }
}
