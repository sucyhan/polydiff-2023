import { TestBed } from '@angular/core/testing';
import { Difference, Point, Rectangle } from '@common/interfaces';

import { DifferenceManipulationsService } from './difference-manipulations.game.service';

describe('DifferenceManipulationsService', () => {
    let service: DifferenceManipulationsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DifferenceManipulationsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should be equal () points', () => {
        const point1: Point = { x: 0, y: 0 };
        const point2: Point = { x: 0, y: 0 };
        expect(service.isPointEqual(point1, point2)).toBe(true);
    });

    it('should not be equal () points', () => {
        const point1: Point = { x: 0, y: 0 };
        const point2: Point = { x: 1, y: 0 };
        expect(service.isPointEqual(point1, point2)).toBe(false);
    });

    it('should be equal () rectangles', () => {
        const rectangle1: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } };
        const rectangle2: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } };
        expect(service.isRectangleEqual(rectangle1, rectangle2)).toBe(true);
    });

    it('should not be equal () retangles', () => {
        const rectangle1: Rectangle = { point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } };
        const rectangle2: Rectangle = { point1: { x: 1, y: 0 }, point2: { x: 0, y: 0 } };
        expect(service.isRectangleEqual(rectangle1, rectangle2)).toBe(false);
    });

    it('should be equal () differences', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference2: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        expect(service.isDifferenceEqual(difference1, difference2)).toBe(true);
    });

    it('should not be equal () differences', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference2: Difference = { rectangles: [{ point1: { x: 1, y: 0 }, point2: { x: 0, y: 0 } }] };
        expect(service.isDifferenceEqual(difference1, difference2)).toBe(false);
    });

    it('should not be equal () differences', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const difference2: Difference = { rectangles: [] };
        expect(service.isDifferenceEqual(difference1, difference2)).toBe(false);
    });

    it('should be in array () differences', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const differences: Difference[] = [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] }];
        expect(service.differencesInclude(difference1, differences)).toBe(true);
    });

    it('should not be in array () differences', () => {
        const difference1: Difference = { rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 0, y: 0 } }] };
        const differences: Difference[] = [];
        expect(service.differencesInclude(difference1, differences)).toBe(false);
    });
});
