import { Injectable } from '@angular/core';
import { Difference, Point, Rectangle } from '@common/interfaces';

@Injectable({
    providedIn: 'root',
})
export class DifferenceManipulationsService {
    isPointEqual(point1: Point, point2: Point) {
        return point1.x === point2.x && point1.y === point2.y;
    }

    isRectangleEqual(rectangle1: Rectangle, rectangle2: Rectangle) {
        return this.isPointEqual(rectangle1.point1, rectangle2.point1) && this.isPointEqual(rectangle1.point2, rectangle2.point2);
    }

    isDifferenceEqual(difference1: Difference, difference2: Difference) {
        if (difference1.rectangles.length !== difference2.rectangles.length) {
            return false;
        }
        for (let i = 0; i < difference1.rectangles.length; i++) {
            if (!this.isRectangleEqual(difference1.rectangles[i], difference2.rectangles[i])) {
                return false;
            }
        }
        return true;
    }

    differencesInclude(difference: Difference, differences: Difference[]) {
        for (const diff of differences) {
            if (this.isDifferenceEqual(difference, diff)) {
                return true;
            }
        }
        return false;
    }
}
