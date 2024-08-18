import { GameData, PlayerData, Point } from '@common/interfaces';
import { expect } from 'chai';
import { SinonSpy, spy, stub } from 'sinon';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
    let validationService: ValidationService;
    let validationServiceSpy: SinonSpy;
    let gameObject: GameData;

    beforeEach(async () => {
        validationService = new ValidationService();
        gameObject = {
            id: 0,
            title: '',
            difficulty: '',
            numberOfDifferences: 0,
            differences: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }],
        };
    });

    it('isValidMove should return false if checkCoordinateIsAlreadyFound return true', async () => {
        const coordinates: Point = { x: 1, y: 1 };
        const playerData: PlayerData[] = [
            { username: 'test', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }], invalidMoves: [] },
        ];
        validationServiceSpy = spy(validationService, 'isValidMove');
        stub(validationService, 'checkCoordinateIsAlreadyFound').returns(true);
        expect(await validationService.isValidMove(coordinates, playerData, gameObject).valid).to.equals(false);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('isValidMove should return false if checkCoordinateIsAlreadyFound return false and isPointInDifference return false', async () => {
        const coordinates: Point = { x: 100, y: 100 };
        const playerData: PlayerData[] = [
            { username: 'test', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }], invalidMoves: [] },
        ];
        validationServiceSpy = spy(validationService, 'isValidMove');
        stub(validationService, 'checkCoordinateIsAlreadyFound').returns(false);
        stub(validationService, 'isPointInDifference').returns(false);
        expect(await validationService.isValidMove(coordinates, playerData, gameObject).valid).to.equals(false);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('isValidMove should return true if checkCoordinateIsAlreadyFound return false and isPointInDifference return true', async () => {
        const coordinates: Point = { x: 1, y: 1 };
        const playerData: PlayerData[] = [
            { username: 'test', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }], invalidMoves: [] },
        ];
        validationServiceSpy = spy(validationService, 'isValidMove');
        stub(validationService, 'checkCoordinateIsAlreadyFound').returns(false);
        stub(validationService, 'isPointInDifference').returns(true);
        expect(await validationService.isValidMove(coordinates, playerData, gameObject).valid).to.equals(true);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('isPointInDifference should return true', () => {
        validationServiceSpy = spy(validationService, 'isPointInDifference');
        const point = { x: 1, y: 1 };
        expect(validationService.isPointInDifference(point, gameObject.differences[0])).to.equals(true);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('isPointInDifference should return false', () => {
        validationServiceSpy = spy(validationService, 'isPointInDifference');
        const point = { x: 100, y: 100 };
        expect(validationService.isPointInDifference(point, gameObject.differences[0])).to.equals(false);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('isPointInRectangle should return true', () => {
        validationServiceSpy = spy(validationService, 'isPointInRectangle');
        const point = { x: 1, y: 1 };
        expect(validationService.isPointInRectangle(point, gameObject.differences[0].rectangles[0])).to.equals(true);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('isPointInRectangle should return false', () => {
        validationServiceSpy = spy(validationService, 'isPointInRectangle');
        const point = { x: 100, y: 100 };
        expect(validationService.isPointInRectangle(point, gameObject.differences[0].rectangles[0])).to.equals(false);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('checkCoordinateIsAlreadyFound should return true if isPointInRectangle returns true', () => {
        validationServiceSpy = spy(validationService, 'checkCoordinateIsAlreadyFound');
        const point = { x: 1, y: 1 };
        const playerData: PlayerData[] = [
            { username: 'test', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }], invalidMoves: [] },
        ];
        stub(validationService, 'isPointInRectangle').returns(true);
        expect(validationService.checkCoordinateIsAlreadyFound(point, playerData)).to.equals(true);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });

    it('checkCoordinateIsAlreadyFound should return false if isPointInRectangle returns false', () => {
        validationServiceSpy = spy(validationService, 'checkCoordinateIsAlreadyFound');
        const point = { x: 100, y: 100 };
        const playerData: PlayerData[] = [
            { username: 'test', differencesFound: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }], invalidMoves: [] },
        ];
        stub(validationService, 'isPointInRectangle').returns(false);
        expect(validationService.checkCoordinateIsAlreadyFound(point, playerData)).to.equals(false);
        expect(validationServiceSpy.calledOnce).to.equal(true);
    });
});
