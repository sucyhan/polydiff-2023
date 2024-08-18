import { DB_COLLECTION_RANKINGS_DEV } from '@app/env';
import { GAME_PLAYER_MODE, USERS_1V1_RANKING, USERS_SOLO_RANKING } from '@common/constants';
import { GameRankings, UsersScore } from '@common/interfaces';
import { Collection, DeleteResult, Filter, UpdateFilter, WithId } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

@Service()
export class RankingService {
    dataBaseService: DatabaseService;
    constructor(dataBaseService: DatabaseService) {
        this.dataBaseService = dataBaseService;
    }
    get collection(): Collection<GameRankings> {
        return this.dataBaseService.database.collection(DB_COLLECTION_RANKINGS_DEV);
    }

    async getAllRankings(): Promise<GameRankings[]> {
        return this.collection
            .find({})
            .toArray()
            .then((gameRanking: GameRankings[]) => {
                return gameRanking;
            });
    }

    async getGameRankings(gameId: number): Promise<GameRankings> {
        return await this.findGameById(gameId);
    }

    async updateRanking(gameId: number, mode: string, newScores: UsersScore[]): Promise<void> {
        const filterQuery: Filter<GameRankings> = { gameId };
        const updateQuery = this.getUpdateFilter(mode, newScores);
        if (!updateQuery) {
            return;
        }
        return this.collection.updateOne(filterQuery, updateQuery).then(() => {
            return;
        });
    }

    async getSolo(gameId: number): Promise<UsersScore[]> {
        return this.collection.findOne({ gameId }).then((game: WithId<GameRankings>) => {
            if (!game) return [];

            return game.singlePlayer;
        });
    }

    async get1v1(gameId: number): Promise<UsersScore[]> {
        return this.collection.findOne({ gameId }).then((game: WithId<GameRankings>) => {
            if (!game) return [];

            return game.multiPlayer;
        });
    }

    async addGame(gameId: number): Promise<void> {
        const newGame: GameRankings = {
            gameId,
            singlePlayer: USERS_SOLO_RANKING,
            multiPlayer: USERS_1V1_RANKING,
        };
        await this.collection.insertOne(newGame);
    }

    async resetRankings(gameId: number): Promise<void> {
        await this.updateRanking(gameId, GAME_PLAYER_MODE.SINGLE_PLAYER, USERS_SOLO_RANKING);
        await this.updateRanking(gameId, GAME_PLAYER_MODE.MULTI_PLAYER, USERS_1V1_RANKING);
    }

    async resetAll(): Promise<void> {
        const games = await this.getAllRankings();
        games.forEach(async (game: GameRankings) => {
            await this.resetRankings(game.gameId);
        });
    }

    async deleteAllGames(): Promise<DeleteResult> {
        return this.collection.deleteMany({});
    }

    async deleteGame(gameId: number): Promise<void> {
        this.collection.findOneAndDelete({ gameId });
    }

    async findGameById(gameId: number): Promise<GameRankings> {
        return this.collection.findOne({ gameId }).then((game: WithId<GameRankings>) => {
            return game;
        });
    }

    private getUpdateFilter(mode: string, newScores: UsersScore[]): UpdateFilter<GameRankings> | void {
        if (mode === GAME_PLAYER_MODE.SINGLE_PLAYER) {
            return {
                $set: {
                    singlePlayer: newScores,
                },
            };
        } else if (mode === GAME_PLAYER_MODE.MULTI_PLAYER) {
            return {
                $set: {
                    multiPlayer: newScores,
                },
            };
        }
    }
}
