import { DB_NAME } from '@app/env';
import { GAME_PLAYER_MODE, USERS_1V1_RANKING, USERS_SOLO_RANKING } from '@common/constants';
import { DatabaseGame, GameRankings, UsersScore } from '@common/interfaces';
import { expect } from 'chai';
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { stub } from 'sinon';
import { DatabaseService } from './database.service';
import { RankingService } from './ranking.service';

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

describe('Ranking service', () => {
    let rankingService: RankingService;
    let databaseService: DatabaseServiceMock;
    let testGameRanking: GameRankings;

    beforeEach(async () => {
        databaseService = new DatabaseServiceMock();
        await databaseService.start();
        rankingService = new RankingService(databaseService as unknown as DatabaseService);
        testGameRanking = {
            gameId: 1,
            singlePlayer: USERS_SOLO_RANKING,
            multiPlayer: USERS_1V1_RANKING,
        };

        await rankingService.collection.insertOne(testGameRanking);
    });

    afterEach(async () => {
        await databaseService.closeConnection();
    });

    it('getAllRankings should return testGameRankings', async () => {
        const gameRankings = await rankingService.getAllRankings();
        expect(gameRankings.length).to.equal(1);
        expect(gameRankings[0]).to.deep.equals(testGameRanking);
    });

    it('getAllRankings should return null if database is empty', async () => {
        await rankingService.deleteAllGames();
        const gameRankings = await rankingService.getAllRankings();
        expect(gameRankings.length).to.equal(0);
    });

    it('getGameRankings should return testGameRanking', async () => {
        const gameRanking = await rankingService.getGameRankings(1);
        expect(gameRanking).to.deep.equal(testGameRanking);
    });

    it('updateRanking should update singlePlayer ranking if mode is singlePlayer', async () => {
        const newScores: UsersScore[] = [
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
        ];
        await rankingService.updateRanking(1, GAME_PLAYER_MODE.SINGLE_PLAYER, newScores);
        const games = await rankingService.collection.find({}).toArray();
        expect(games.length).to.equal(1);
        const updatedGame = games.find((game: DatabaseGame) => game.gameId === testGameRanking.gameId);
        expect(updatedGame?.singlePlayer).to.deep.equal(newScores);
    });

    it('updateRanking should update multiPlayer ranking if mode is multiPlayer', async () => {
        const newScores: UsersScore[] = [
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
        ];

        await rankingService.updateRanking(1, GAME_PLAYER_MODE.MULTI_PLAYER, newScores);
        const games = await rankingService.collection.find({}).toArray();
        expect(games.length).to.equal(1);
        const updatedGame = games.find((game: DatabaseGame) => game.gameId === testGameRanking.gameId);
        expect(updatedGame?.multiPlayer).to.deep.equal(newScores);
    });

    it('updateRanking should not update if gameId is invalid', async () => {
        const newScores: UsersScore[] = [
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
        ];
        const invalidId = 100;

        await rankingService.updateRanking(invalidId, GAME_PLAYER_MODE.SINGLE_PLAYER, newScores);
        const games = await rankingService.collection.find({}).toArray();
        expect(games.length).to.equal(1);
        const validGame = games.find((game: DatabaseGame) => game.gameId === testGameRanking.gameId);
        expect(validGame?.singlePlayer).to.not.deep.equal(newScores);
        expect(validGame?.multiPlayer).to.not.deep.equal(newScores);
    });

    it('updateRanking should not update if mode is invalid', async () => {
        const newScores: UsersScore[] = [
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
        ];
        const invalidId = 1;
        await rankingService.updateRanking(invalidId, 'invalid', newScores);
        const games = await rankingService.collection.find({}).toArray();
        expect(games.length).to.equal(1);
        const validGame = games.find((game: DatabaseGame) => game.gameId === testGameRanking.gameId);
        expect(validGame?.singlePlayer).to.not.deep.equal(newScores);
        expect(validGame?.multiPlayer).to.not.deep.equal(newScores);
    });

    it('getSolo should return singlePlayer scores', async () => {
        const scores = await rankingService.getSolo(1);
        expect(scores).to.deep.equal(USERS_SOLO_RANKING);
    });

    it('getSolo should return empty array if game is undefined', async () => {
        const scores = await rankingService.getSolo(2);
        expect(scores).to.deep.equal([]);
    });

    it('get1v1 should return multiPlayer scores', async () => {
        const scores = await rankingService.get1v1(1);
        expect(scores).to.deep.equal(USERS_1V1_RANKING);
    });

    it('get1v1 should return empty array if game is undefined', async () => {
        const scores = await rankingService.get1v1(2);
        expect(scores).to.deep.equal([]);
    });

    it('addGame should insert new game with default scores', async () => {
        const secondGame: GameRankings = { gameId: 2, singlePlayer: USERS_SOLO_RANKING, multiPlayer: USERS_1V1_RANKING };
        await rankingService.addGame(2);
        const games = await rankingService.collection.find({}).toArray();
        expect(games.length).to.equal(2);
        const gameInDB = games.find((game: DatabaseGame) => game.gameId === secondGame.gameId);
        expect(gameInDB?.gameId).to.equal(secondGame.gameId);
        expect(gameInDB?.singlePlayer).to.deep.equal(secondGame.singlePlayer);
        expect(gameInDB?.multiPlayer).to.deep.equal(secondGame.multiPlayer);
    });

    it('resetRankings should call updateRanking on both arrays for game with gameId', async () => {
        const updateStub = stub(rankingService, 'updateRanking').callsFake(async () => {
            return;
        });
        await rankingService.resetRankings(1);
        expect(updateStub.calledTwice).to.equal(true);
    });

    it('resetAll should call getAllRankings', async () => {
        const getStub = stub(rankingService, 'getAllRankings').callsFake(async () => {
            return [];
        });
        await rankingService.resetAll();
        expect(getStub.calledOnce).to.equal(true);
    });

    it('resetAll should call getAllRankings', async () => {
        const getStub = stub(rankingService, 'getAllRankings').callsFake(async () => {
            return [{ gameId: 1 } as GameRankings];
        });
        const resetStub = stub(rankingService, 'resetRankings').callsFake(async () => {
            return;
        });
        await rankingService.resetAll();
        expect(getStub.calledOnce).to.equal(true);
        expect(resetStub.calledOnce).to.equal(true);
    });

    it('deleteAllGames should delete all games', async () => {
        await rankingService.deleteAllGames();
        expect(await rankingService.collection.countDocuments()).to.equal(0);
    });

    it('deleteGame should delete the game if valid gameId is sent', async () => {
        await rankingService.deleteGame(1);
        const games = await rankingService.collection.find({}).toArray();
        expect(games.length).to.equal(0);
    });

    it('deleteGame should not delete a game rankings if the gameId is invalid', async () => {
        const invalidId = 10;
        try {
            await rankingService.deleteGame(invalidId);
        } catch {
            const games = await rankingService.collection.find({}).toArray();
            expect(games.length).to.equal(1);
        }
    });

    it('findGameById should return game with gameId', async () => {
        const game = await rankingService['findGameById'](1);
        expect(game).to.deep.equal(testGameRanking);
    });

    it('getUpdateFilter should return filter to set singlePlayer if mode is singlePlayer', () => {
        const newScores: UsersScore[] = [
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
        ];
        const filter = rankingService['getUpdateFilter'](GAME_PLAYER_MODE.SINGLE_PLAYER, newScores);
        expect(filter).to.deep.equal({
            $set: {
                singlePlayer: newScores,
            },
        });
    });

    it('getUpdateFilter should return filter to set multiPlayer if mode is multiPlayer', () => {
        const newScores: UsersScore[] = [
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
        ];
        const filter = rankingService['getUpdateFilter'](GAME_PLAYER_MODE.MULTI_PLAYER, newScores);
        expect(filter).to.deep.equal({
            $set: {
                multiPlayer: newScores,
            },
        });
    });

    it('getUpdateFilter should return void if mode is invalid', () => {
        const newScores: UsersScore[] = [
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
            { name: 'test', time: 0 },
        ];
        const filter = rankingService['getUpdateFilter']('invalid', newScores);
        expect(filter).to.be.equal(undefined);
    });
});
