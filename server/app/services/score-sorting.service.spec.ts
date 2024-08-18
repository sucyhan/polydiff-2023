import { GAME_PLAYER_MODE, USERS_1V1_RANKING, USERS_SOLO_RANKING } from '@common/constants';
import { GameRankings, UsersScore } from '@common/interfaces';
import { expect } from 'chai';
import { stub } from 'sinon';
import { RankingService } from './ranking.service';
import { DatabaseServiceMock } from './ranking.service.spec';
import { ScoreSortingService } from './score-sorting.service';

export class RankingServiceMock {
    dataBaseService = new DatabaseServiceMock();

    get collection() {
        return 0;
    }

    async getGameRankings(gameId: number) {
        return gameId;
    }
    async getAllRankings() {
        return 'done';
    }
    // eslint-disable-next-line no-unused-vars
    async updateRanking(gameID: number, mode: string, newScores: UsersScore[]) {
        return;
    }

    async getSolo(gameID: number) {
        return gameID;
    }

    async get1v1(gameID: number) {
        return gameID;
    }

    async addGame(gameID: number) {
        return gameID;
    }

    async resetRankings(gameID: number) {
        return gameID;
    }
    async deleteAllGames() {
        return;
    }
    async deleteGame(gameID: number) {
        return gameID;
    }

    async findGameById(gameID: number) {
        return gameID;
    }
    async resetAll() {
        return;
    }

    // Needed to mock function getUpdateFilter
    // eslint-disable-next-line no-unused-vars
    getUpdateFilter(mode: string, newScores: UsersScore[]) {
        return;
    }
}

describe('ScoreSortingService', () => {
    let service: ScoreSortingService;
    let rankingService: RankingService;
    let currentScores: UsersScore[];
    beforeEach(async () => {
        rankingService = new RankingServiceMock() as unknown as RankingService;
        service = new ScoreSortingService(rankingService);
        currentScores = [
            { name: 'test1', time: 10 },
            { name: 'test2', time: 20 },
            { name: 'test3', time: 30 },
        ];
    });

    it('findPosition should return -1 is not in top 3', () => {
        const position = -1;
        const topFourScore: UsersScore = { name: 'test4', time: 31 };
        expect(service.findPosition(topFourScore, currentScores)).equal(position);
    });

    it('findPosition should return 0 is in top 1', () => {
        const position = 0;
        const topFourScore: UsersScore = { name: 'test4', time: 5 };
        expect(service.findPosition(topFourScore, currentScores)).equal(position);
    });

    it('findPosition should return 1 is not in top 2', () => {
        const position = 1;
        const topFourScore: UsersScore = { name: 'test4', time: 15 };
        expect(service.findPosition(topFourScore, currentScores)).equal(position);
    });

    it('findPosition should return 2 is not in top 3', () => {
        const position = 2;
        const topFourScore: UsersScore = { name: 'test4', time: 25 };
        expect(service.findPosition(topFourScore, currentScores)).equal(position);
    });

    it('updateRanking should update with no changes if time is not in top 3', async () => {
        const uneligiblePosition = -1;
        stub(service, 'getScores').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(currentScores);
            });
        });
        const notEligibleScore: UsersScore = { name: 'test4', time: 300 };
        const result = await service.updateRanking(1, GAME_PLAYER_MODE.SINGLE_PLAYER, notEligibleScore);
        const newScores = result[0];
        expect(result[1]).to.equal(uneligiblePosition);
        const expectedScoreArray: UsersScore[] = [
            { name: 'test1', time: 10 },
            { name: 'test2', time: 20 },
            { name: 'test3', time: 30 },
        ];
        expect(newScores[0].name).equal(expectedScoreArray[0].name);
        expect(newScores[0].time).equal(expectedScoreArray[0].time);

        expect(newScores[1].name).equal(expectedScoreArray[1].name);
        expect(newScores[1].time).equal(expectedScoreArray[1].time);

        expect(newScores[2].name).equal(expectedScoreArray[2].name);
        expect(newScores[2].time).equal(expectedScoreArray[2].time);
    });

    it('updateRanking should update if time is  in top 1', async () => {
        stub(service, 'getScores').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(currentScores);
            });
        });
        const eligibleScore: UsersScore = { name: 'test4', time: 5 };
        const result = await service.updateRanking(1, GAME_PLAYER_MODE.SINGLE_PLAYER, eligibleScore);
        const newScores = result[0];
        expect(result[1]).to.equal(1);
        const expectedScoreArray: UsersScore[] = [
            { name: 'test4', time: 5 },
            { name: 'test1', time: 10 },
            { name: 'test2', time: 20 },
        ];

        expect(newScores[0].name).equal(expectedScoreArray[0].name);
        expect(newScores[0].time).equal(expectedScoreArray[0].time);

        expect(newScores[1].name).equal(expectedScoreArray[1].name);
        expect(newScores[1].time).equal(expectedScoreArray[1].time);

        expect(newScores[2].name).equal(expectedScoreArray[2].name);
        expect(newScores[2].time).equal(expectedScoreArray[2].time);
    });

    it('updateRanking should update if time is  in top 2', async () => {
        stub(service, 'getScores').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(currentScores);
            });
        });
        const eligibleScore: UsersScore = { name: 'test4', time: 15 };
        const result = await service.updateRanking(1, GAME_PLAYER_MODE.SINGLE_PLAYER, eligibleScore);
        const newScores = result[0];
        expect(result[1]).to.equal(2);
        const expectedScoreArray: UsersScore[] = [
            { name: 'test1', time: 10 },
            { name: 'test4', time: 15 },
            { name: 'test2', time: 20 },
        ];

        expect(newScores[0].name).equal(expectedScoreArray[0].name);
        expect(newScores[0].time).equal(expectedScoreArray[0].time);

        expect(newScores[1].name).equal(expectedScoreArray[1].name);
        expect(newScores[1].time).equal(expectedScoreArray[1].time);

        expect(newScores[2].name).equal(expectedScoreArray[2].name);
        expect(newScores[2].time).equal(expectedScoreArray[2].time);
    });

    it('updateRanking should update if time is in top 3', async () => {
        stub(service, 'getScores').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(currentScores);
            });
        });
        const eligibleScore: UsersScore = { name: 'test4', time: 25 };
        const result = await service.updateRanking(1, GAME_PLAYER_MODE.SINGLE_PLAYER, eligibleScore);
        const newScores = result[0];
        expect(result[1]).to.equal(3);
        const expectedScoreArray: UsersScore[] = [
            { name: 'test1', time: 10 },
            { name: 'test2', time: 20 },
            { name: 'test4', time: 25 },
        ];

        expect(newScores[0].name).equal(expectedScoreArray[0].name);
        expect(newScores[0].time).equal(expectedScoreArray[0].time);

        expect(newScores[1].name).equal(expectedScoreArray[1].name);
        expect(newScores[1].time).equal(expectedScoreArray[1].time);

        expect(newScores[2].name).equal(expectedScoreArray[2].name);
        expect(newScores[2].time).equal(expectedScoreArray[2].time);
    });

    it('getHighestTime should return the highest score (30)', () => {
        const highestExpected = 30;
        expect(service.getHighestTime(currentScores)).equal(highestExpected);
    });

    it('getScores should call getSolo if mode is singlePlayer', async () => {
        const gameID = 1;
        stub(rankingService, 'getSolo').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(currentScores);
            });
        });
        const scores = await service.getScores(gameID, GAME_PLAYER_MODE.SINGLE_PLAYER);
        expect(scores).to.deep.equal(currentScores);
    });

    it('getScores should call get1v1 if mode is multiPlayer', async () => {
        const gameID = 1;
        stub(rankingService, 'get1v1').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(currentScores);
            });
        });
        const scores = await service.getScores(gameID, GAME_PLAYER_MODE.MULTI_PLAYER);
        expect(scores).to.deep.equal(currentScores);
    });

    it('getGameScores should return gameRankings', async () => {
        const expectedGameRankings: GameRankings = { gameId: 1, singlePlayer: USERS_SOLO_RANKING, multiPlayer: USERS_1V1_RANKING };
        stub(rankingService, 'getGameRankings').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(expectedGameRankings);
            });
        });
        const game = await service.getGameScores(expectedGameRankings.gameId);
        expect(game).to.deep.equal(expectedGameRankings);
    });

    it('resetGameScores should reset', async () => {
        const expectedGameRankings: GameRankings = { gameId: 1, singlePlayer: USERS_SOLO_RANKING, multiPlayer: USERS_1V1_RANKING };
        stub(rankingService, 'resetRankings').callsFake(async () => {
            return new Promise((resolve) => {
                resolve();
            });
        });
        const game = await service.resetGameScores(expectedGameRankings.gameId);
        expect(game).to.deep.equal(undefined);
    });

    it('resetAll should reset', async () => {
        stub(rankingService, 'resetAll').callsFake(async () => {
            return new Promise((resolve) => {
                resolve();
            });
        });
        const game = await service.resetAll();
        expect(game).to.deep.equal(undefined);
    });

    it('gameExists should do', async () => {
        const id = 1;
        const expectedGameRankings: GameRankings = { gameId: 1, singlePlayer: USERS_SOLO_RANKING, multiPlayer: USERS_1V1_RANKING };
        stub(rankingService, 'findGameById').callsFake(async () => {
            return new Promise((resolve) => {
                resolve(expectedGameRankings);
            });
        });
        const game = await service.gameExists(id);
        expect(game).to.deep.equal(expectedGameRankings);
    });
});
