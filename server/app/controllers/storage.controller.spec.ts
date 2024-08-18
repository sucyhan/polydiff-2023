import { Application } from '@app/app';
import { RankingService } from '@app/services/ranking.service';
import { ScoreSortingService } from '@app/services/score-sorting.service';
import { StorageService } from '@app/services/storage.service';
import { FILE_TYPE } from '@common/constants';
import { GameData, UsersScore } from '@common/interfaces';
import { ValidIdsMessage } from '@common/messages';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('Storage Controller', () => {
    let storageService: SinonStubbedInstance<StorageService>;
    let rankingService: SinonStubbedInstance<RankingService>;
    let scoreService: SinonStubbedInstance<ScoreSortingService>;
    let expressApp: Express.Application;
    const testId = -1;

    const gameObject: GameData = {
        id: testId,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }],
    };

    beforeEach(async () => {
        storageService = createStubInstance(StorageService);
        rankingService = createStubInstance(RankingService);
        scoreService = createStubInstance(ScoreSortingService);
        const app = Container.get(Application);
        Object.defineProperty(app['storageController'], 'storageService', { value: storageService, writable: true });
        Object.defineProperty(app['storageController'], 'rankingService', { value: rankingService, writable: true });
        Object.defineProperty(app['storageController'], 'scoreService', { value: scoreService, writable: true });
        expressApp = app.app;
    });

    it('should return OK along with the file on post request', async () => {
        const message = { id: testId, type: FILE_TYPE.imageJSON };
        const response = 'test';
        storageService.readFile.resolves(response);
        await supertest(expressApp).post('/api/storage/read').send(message).expect(StatusCodes.OK).expect(JSON.stringify(response));
        expect(storageService.readFile.calledOnceWith(message.id, message.type)).to.equal(true);
    });

    it('should return Created on post request modify', async () => {
        const message = { id: testId, type: FILE_TYPE.imageJSON, data: 'test' };
        storageService.writeFile.resolves();
        await supertest(expressApp).post('/api/storage/modify').send(message).expect(StatusCodes.CREATED);
        expect(storageService.writeFile.calledOnceWith(message.id, message.data, message.type)).to.equal(true);
    });

    it('should return Created on post request create', async () => {
        const message = { originalImageData: 'test', modifiedImageData: 'test', imageJSON: JSON.stringify(gameObject) };
        storageService.getNewId.resolves(testId);
        storageService.writeFile.resolves();
        storageService.writeImage.resolves();
        await supertest(expressApp)
            .post('/api/storage/create')
            .send(message)
            .expect(StatusCodes.CREATED)
            .expect(JSON.stringify({ id: testId }));
        expect(storageService.writeFile.calledOnce).to.equal(true);
        expect(storageService.writeImage.calledTwice).to.equal(true);
    });

    it('should return No Content on delete request game', async () => {
        const message = { id: testId };
        storageService.deleteFile.resolves();
        await supertest(expressApp).delete('/api/storage/game').query(message).expect(StatusCodes.NO_CONTENT);
        expect(storageService.deleteFile.calledThrice).to.equal(true);
    });

    it('should return No Content on delete request games', async () => {
        storageService.deleteAll.resolves();
        rankingService.deleteAllGames.resolves();
        await supertest(expressApp).delete('/api/storage/games').expect(StatusCodes.NO_CONTENT);
        expect(storageService.deleteAll.calledOnce).to.equal(true);
        expect(rankingService.deleteAllGames.calledOnce).to.equal(true);
    });

    it('should return OK on get request for getValidIds', async () => {
        const response: ValidIdsMessage = { validIds: [testId] };
        storageService.getValidIds.resolves(response);
        await supertest(expressApp).get('/api/storage/getValidIds').expect(StatusCodes.OK).expect(JSON.stringify(response));
        expect(storageService.getValidIds.calledOnce).to.equal(true);
    });

    it('should call getScores', async () => {
        scoreService.getScores.resolves([] as UsersScore[]);
        await supertest(expressApp).post('/api/storage/score').send({ id: 1, gamePlayerMode: 'solo' }).expect(StatusCodes.OK);
    });
});
