import { Difference, GameData, PlayerData, Point, Rectangle } from '@common/interfaces';
import { ValidMoveResponseMessage } from '@common/messages';
import { Service } from 'typedi';

@Service()
export class ValidationService {
    isValidMove(coordinate: Point, playerData: PlayerData[], gameData: GameData): ValidMoveResponseMessage {
        if (!this.checkCoordinateIsAlreadyFound(coordinate, playerData)) {
            for (const difference of gameData.differences) {
                if (this.isPointInDifference(coordinate, difference)) {
                    return { valid: true, difference };
                }
            }
        }
        return { valid: false };
    }

    isPointInDifference(point: Point, difference: Difference): boolean {
        for (const rectangle of difference.rectangles) {
            if (this.isPointInRectangle(point, rectangle)) {
                return true;
            }
        }
        return false;
    }

    isPointInRectangle(point: Point, rectangle: Rectangle): boolean {
        return point.x >= rectangle.point1.x && point.x <= rectangle.point2.x && point.y >= rectangle.point1.y && point.y <= rectangle.point2.y;
    }

    checkCoordinateIsAlreadyFound(coordinate: Point, playerData: PlayerData[]): boolean {
        for (const player of playerData) {
            for (const difference of player.differencesFound) {
                for (const rectangle of difference.rectangles) {
                    if (this.isPointInRectangle(coordinate, rectangle)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
