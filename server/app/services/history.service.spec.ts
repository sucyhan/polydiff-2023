import { DB_NAME } from '@app/env';
import { DEFAULT_HISTORY_DATA, GAME_PLAYER_MODE } from '@common/constants';
import { HistoryData, PlayerInfo, PrivateFunction } from '@common/interfaces';
import { expect } from 'chai';
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { stub } from 'sinon';
import { DatabaseService } from './database.service';
import { HistoryService } from './history.service';

export class DatabaseServiceMock {
    mongoServer: MongoMemoryServer;
    private db: Db;
    private client: MongoClient;

    get database(): Db {
        return this.db;
    }

    async start(): Promise<MongoClient | null> {
        if (!this.client) {
            this.mongoServer = await MongoMemoryServer.create();
            const mongoUri = this.mongoServer.getUri();
            this.client = new MongoClient(mongoUri);
            await this.client.connect();
            this.db = this.client.db(DB_NAME);
        }

        return this.client;
    }

    async closeConnection(): Promise<void> {
        if (this.client) {
            return this.client.close();
        } else {
            return Promise.resolve();
        }
    }
}

describe('History service', () => {
    let historyService: HistoryService;
    let databaseService: DatabaseServiceMock;
    let testHistoryData: HistoryData;

    beforeEach(async () => {
        databaseService = new DatabaseServiceMock();
        await databaseService.start();
        historyService = new HistoryService(databaseService as unknown as DatabaseService);
        testHistoryData = {
            date: 'date',
            duration: 400,
            mode: GAME_PLAYER_MODE.SINGLE_PLAYER,
            player1: { name: 'user1', isWinner: false, isQuitter: false },
            player2: { name: 'user2', isWinner: true, isQuitter: false },
        };

        await historyService.collection.insertOne(testHistoryData);
    });

    afterEach(async () => {
        await databaseService.closeConnection();
    });

    it('getHistory should return testHistoryData', async () => {
        const historyData = await historyService.getHistory();
        expect(historyData.length).to.equal(1);
        expect(historyData[0]).to.deep.equal(testHistoryData);
    });

    it('getHistory should return null if database is empty', async () => {
        await historyService.collection.deleteMany({});
        const historyData = await historyService.getHistory();
        expect(historyData.length).to.equal(0);
    });

    it('addHistory should insert new history data if not isLastInput', async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        stub(historyService, <PrivateFunction>'isLastInput').returns(false);
        const player: PlayerInfo = { name: 'user', isWinner: false, isQuitter: false };
        const secondHistory: HistoryData = { date: 'date1', duration: 500, mode: GAME_PLAYER_MODE.MULTI_PLAYER, player1: player, player2: player };
        await historyService.addHistory(secondHistory);
        const fullHistory = await historyService.collection.find({}).toArray();
        expect(fullHistory.length).to.equal(2);
    });

    it('addHistory should not insert new history data if isLastInput', async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        stub(historyService, <PrivateFunction>'isLastInput').returns(true);
        const player: PlayerInfo = { name: 'user', isWinner: false, isQuitter: false };
        const secondHistory: HistoryData = { date: 'date1', duration: 500, mode: GAME_PLAYER_MODE.MULTI_PLAYER, player1: player, player2: player };
        await historyService.addHistory(secondHistory);
        const fullHistory = await historyService.collection.find({}).toArray();
        expect(fullHistory.length).to.equal(1);
    });

    it('deleteHistory should delete all history data', async () => {
        await historyService.deleteHistory();
        expect(await historyService.collection.countDocuments()).to.equal(0);
    });

    it('isLastInput should return false if history.date is equal to last input', () => {
        const historyData: HistoryData = {
            date: 'test',
            duration: 100,
            mode: 'test',
            player1: { name: '', isQuitter: false, isWinner: true },
            player2: { name: '', isQuitter: false, isWinner: true },
        };
        const result = historyService['isLastInput'](historyData);
        expect(result).to.equal(false);
    });

    it('isLastInput should return true if historyData is equal to last input', () => {
        const historyData = DEFAULT_HISTORY_DATA;
        const result = historyService['isLastInput'](historyData);
        expect(result).to.equal(true);
    });

    it('isLastInput should return false if historyData.date is not equal to last input date', () => {
        const historyData: HistoryData = {
            date: 'notEqual',
            duration: 0,
            mode: '',
            player1: { name: '', isWinner: false, isQuitter: false },
            player2: { name: '', isWinner: false, isQuitter: false },
        };
        const result = historyService['isLastInput'](historyData);
        expect(result).to.equal(false);
    });

    it('isLastInput should return false if historyData.duration is not equal to last input duration', () => {
        const historyData: HistoryData = {
            date: 'date',
            duration: 100,
            mode: '',
            player1: { name: '', isWinner: false, isQuitter: false },
            player2: { name: '', isWinner: false, isQuitter: false },
        };
        const result = historyService['isLastInput'](historyData);
        expect(result).to.equal(false);
    });

    it('isLastInput should return false if historyData.mode is not equal to last input mode', () => {
        const historyData: HistoryData = {
            date: 'date',
            duration: 0,
            mode: 'classic',
            player1: { name: '', isWinner: false, isQuitter: false },
            player2: { name: '', isWinner: false, isQuitter: false },
        };
        const result = historyService['isLastInput'](historyData);
        expect(result).to.equal(false);
    });
});
