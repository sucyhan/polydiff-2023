// src: https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
import { Injectable } from '@angular/core';
import {
    DEFAULT_HEIGHT,
    DEFAULT_WIDTH,
    FIRST_HINT_DIMENSIONS,
    FLASHES,
    GAME_EVENTS,
    GAME_TIMER_MODE,
    HINT_WIDTH,
    Quadrant,
    SECOND_HINT_DIMENSIONS,
    TIME,
} from '@common/constants';
import { Difference, Dimensions, GameConstants, Point, Rectangle } from '@common/interfaces';
import { Subject } from 'rxjs';
import { StateGameService } from './state.game.service';

@Injectable({
    providedIn: 'root',
})
export class HintService {
    timePenalty: number = 1;
    requestId: number;
    hintsUsedChanged = new Subject<number>();
    numberOfHints = 0;
    animateX = 0;
    animateY = 0;
    middleX = 0;
    middleY = 0;

    constructor(private readonly stateGameService: StateGameService) {
        this.stateGameService.gameConstantsChanged.subscribe((constants: GameConstants[]) => {
            this.timePenalty = constants[1].time;
        });
    }

    handleHint(contexts: CanvasRenderingContext2D[], differences: Difference[]) {
        if (this.numberOfHints >= 3) {
            return;
        }

        const difference: Difference = this.pickDifference(differences);
        this.stateGameService.replayEvents.push({ type: GAME_EVENTS.HINT, time: this.stateGameService.time, eventData: difference });
        if (this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC) this.stateGameService.time += this.timePenalty;
        if (this.stateGameService.timerMode === GAME_TIMER_MODE.TIMED) this.stateGameService.time -= this.timePenalty;
        if (this.stateGameService.time <= 0) this.stateGameService.time = 0;
        this.stateGameService.timeChanged.next(this.stateGameService.time);

        switch (this.numberOfHints) {
            case 0: {
                const quadrant: Quadrant = this.getQuadrant(this.getDifferenceBorder(difference));
                const point: Point = this.fromQuadrantToPoint(quadrant);
                this.drawHint(contexts, point, FIRST_HINT_DIMENSIONS);
                break;
            }
            case 1: {
                const point2: Point = this.fromQuadrantTo16QuadrantPoint(this.getDifferenceBorder(difference));
                this.drawHint(contexts, point2, SECOND_HINT_DIMENSIONS);
                break;
            }
            case 2:
                this.animate(contexts);
                setTimeout(() => {
                    cancelAnimationFrame(this.requestId);
                    this.clearHints(contexts);
                }, TIME.FIVE_MINUTES);
                break;
        }
        this.numberOfHints++;
        this.hintsUsedChanged.next(this.numberOfHints);
    }

    pickDifference(differences: Difference[]): Difference {
        const diff = differences[Math.round(Math.random() * (differences.length - 1))];
        if (this.numberOfHints === 2) {
            this.middleY = (diff.rectangles[0].point1.y + diff.rectangles[0].point2.y) / 2;
            this.middleX = (diff.rectangles[0].point1.x + diff.rectangles[0].point2.x) / 2;
        }

        return diff;
    }

    getDifferenceBorder(difference: Difference): Rectangle {
        const returnRectangle: Rectangle = { point1: difference.rectangles[0].point1, point2: difference.rectangles[0].point2 };
        for (const rectangle of difference.rectangles) {
            returnRectangle.point1.x = Math.min(returnRectangle.point1.x, rectangle.point1.x);
            returnRectangle.point1.y = Math.min(returnRectangle.point1.y, rectangle.point1.y);
            returnRectangle.point2.x = Math.max(returnRectangle.point2.x, rectangle.point2.x);
            returnRectangle.point2.y = Math.max(returnRectangle.point2.y, rectangle.point2.y);
        }
        return returnRectangle;
    }

    getQuadrant(rectangle: Rectangle): Quadrant {
        if (rectangle.point1.x < FIRST_HINT_DIMENSIONS.width) {
            if (rectangle.point1.y < FIRST_HINT_DIMENSIONS.height) {
                return Quadrant.LEFT_UP;
            } else {
                return Quadrant.LEFT_DOWN;
            }
        } else {
            if (rectangle.point1.y < FIRST_HINT_DIMENSIONS.height) {
                return Quadrant.RIGHT_UP;
            } else {
                return Quadrant.RIGHT_DOWN;
            }
        }
    }

    fromQuadrantTo16QuadrantPoint(rectangle: Rectangle): Point {
        const quadrantPoint: Point = this.fromQuadrantToPoint(this.getQuadrant(rectangle));
        if (rectangle.point1.x < quadrantPoint.x + SECOND_HINT_DIMENSIONS.width) {
            if (rectangle.point1.y < quadrantPoint.y + SECOND_HINT_DIMENSIONS.height) {
                return { x: quadrantPoint.x, y: quadrantPoint.y };
            } else {
                return { x: quadrantPoint.x, y: quadrantPoint.y + SECOND_HINT_DIMENSIONS.height };
            }
        } else {
            if (rectangle.point1.y < SECOND_HINT_DIMENSIONS.height) {
                return { x: quadrantPoint.x + SECOND_HINT_DIMENSIONS.width, y: quadrantPoint.y };
            } else {
                return { x: quadrantPoint.x + SECOND_HINT_DIMENSIONS.width, y: quadrantPoint.y + SECOND_HINT_DIMENSIONS.height };
            }
        }
    }

    fromQuadrantToPoint(quadrant: Quadrant): Point {
        switch (quadrant) {
            case Quadrant.LEFT_DOWN:
                return { x: 0, y: 240 };
            case Quadrant.LEFT_UP:
                return { x: 0, y: 0 };
            case Quadrant.RIGHT_DOWN:
                return { x: 320, y: 240 };
            case Quadrant.RIGHT_UP:
                return { x: 320, y: 0 };
        }
    }

    drawHint(contexts: CanvasRenderingContext2D[], point: Point, dimensions: Dimensions) {
        this.setUpHint(contexts);
        for (let i = 0; i < FLASHES * 2 - 1; i++) {
            if (i % 2 === 0) {
                setTimeout(() => {
                    this.drawRect(point, contexts, dimensions);
                }, TIME.ONE_TENTH_SECOND * (i + 1));
            } else {
                setTimeout(() => {
                    this.clearHints(contexts);
                }, TIME.ONE_TENTH_SECOND * (i + 1));
            }
        }
        setTimeout(() => {
            this.clearHints(contexts);
        }, TIME.ONE_TENTH_SECOND * (FLASHES * 2));
    }

    drawRect(startPoint: Point, contexts: CanvasRenderingContext2D[], dimensions: Dimensions) {
        for (const context of contexts) {
            context.strokeRect(
                startPoint.x + HINT_WIDTH / 2,
                startPoint.y + HINT_WIDTH / 2,
                dimensions.width - HINT_WIDTH,
                dimensions.height - HINT_WIDTH,
            );
            context.shadowColor = '#000000';
            context.shadowBlur = 15;
        }
    }

    clearHints(contexts: CanvasRenderingContext2D[]) {
        for (const context of contexts) {
            context.clearRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        }
    }

    setUpHint(contexts: CanvasRenderingContext2D[]) {
        for (const context of contexts) {
            context.strokeStyle = 'rgb(255, 0, 0)';
            context.lineWidth = HINT_WIDTH;
        }
    }

    animate(contexts: CanvasRenderingContext2D[]) {
        if (this.animateX >= this.middleX && this.animateY >= this.middleY) {
            return;
        }
        this.requestId = requestAnimationFrame(() => {
            this.animate.bind(this)(contexts);
        });
        for (const context of contexts) {
            context.clearRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
            this.drawCircle(context);
        }
        if (this.animateX <= this.middleX) {
            this.animateX += 4;
        }
        if (this.animateY <= this.middleY) {
            this.animateY += 4;
        }
    }

    drawCircle(context: CanvasRenderingContext2D) {
        const radius = 30;
        context.beginPath();
        context.arc(this.animateX, this.animateY, radius, 0, Math.PI * 2, false);
        context.stroke();
    }

    isHintAvailable() {
        return this.numberOfHints < 3;
    }

    reset() {
        this.numberOfHints = 0;
        this.animateX = 0;
        this.animateY = 0;
        cancelAnimationFrame(this.requestId);
    }
}
