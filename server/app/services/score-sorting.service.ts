import { GAME_PLAYER_MODE } from '@common/constants';
import { GameRankings, UsersScore } from '@common/interfaces';
import { RankingService } from './ranking.service';

export class ScoreSortingService {
    constructor(private readonly rankingService: RankingService) {}

    findPosition(scoreToAdd: UsersScore, currentScores: UsersScore[]) {
        let position = -1;
        for (let i = 0; i < 3; i++) {
            if (scoreToAdd.time < currentScores[i].time) {
                position = i;
                break;
            }
        }
        return position;
    }

    async updateRanking(gameID: number, mode: string, scoreToAdd: UsersScore): Promise<[UsersScore[], number]> {
        const currentScores = await this.getScores(gameID, mode);
        const highestTime = this.getHighestTime(currentScores);
        let position: number;
        const newRanking: UsersScore[] = [];
        let ranking = -1;
        if (scoreToAdd.time < highestTime) {
            position = this.findPosition(scoreToAdd, currentScores);

            switch (position) {
                case 0: {
                    newRanking.push({ name: scoreToAdd.name, time: scoreToAdd.time });
                    newRanking.push({ name: currentScores[0].name, time: currentScores[0].time });
                    newRanking.push({ name: currentScores[1].name, time: currentScores[1].time });
                    ranking = 1;
                    break;
                }
                case 1: {
                    newRanking.push({ name: currentScores[0].name, time: currentScores[0].time });
                    newRanking.push({ name: scoreToAdd.name, time: scoreToAdd.time });
                    newRanking.push({ name: currentScores[1].name, time: currentScores[1].time });
                    ranking = 2;
                    break;
                }
                case 2: {
                    newRanking.push({ name: currentScores[0].name, time: currentScores[0].time });
                    newRanking.push({ name: currentScores[1].name, time: currentScores[1].time });
                    newRanking.push({ name: scoreToAdd.name, time: scoreToAdd.time });
                    ranking = 3;
                    break;
                }
            }
            this.rankingService.updateRanking(gameID, mode, newRanking);
            return [newRanking, ranking];
        }
        return [currentScores, ranking];
    }

    getHighestTime(currentScores: UsersScore[]): number {
        return currentScores[2].time;
    }

    async getScores(gameID: number, mode: string): Promise<UsersScore[]> {
        if (mode === GAME_PLAYER_MODE.SINGLE_PLAYER) {
            return await this.rankingService.getSolo(gameID);
        } else {
            return await this.rankingService.get1v1(gameID);
        }
    }

    async getGameScores(gameID: number): Promise<GameRankings> {
        return await this.rankingService.getGameRankings(gameID);
    }

    async resetGameScores(gameID: number): Promise<void> {
        return await this.rankingService.resetRankings(gameID);
    }

    async resetAll(): Promise<void> {
        return await this.rankingService.resetAll();
    }

    async gameExists(id: number) {
        return await this.rankingService.findGameById(id);
    }
}
