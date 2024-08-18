import { DB_COLLECTION_HISTORY_DEV } from '@app/env';
import { DEFAULT_HISTORY_DATA } from '@common/constants';
import { HistoryData } from '@common/interfaces';
import { Collection, DeleteResult } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

@Service()
export class HistoryService {
    private lastHistoryData: HistoryData = DEFAULT_HISTORY_DATA;
    constructor(private readonly databaseService: DatabaseService) {}

    get collection(): Collection<HistoryData> {
        return this.databaseService.database.collection(DB_COLLECTION_HISTORY_DEV);
    }

    async getHistory(): Promise<HistoryData[]> {
        return this.collection
            .find({})
            .toArray()
            .then((historyData: HistoryData[]) => {
                return historyData;
            });
    }

    async addHistory(historyData: HistoryData): Promise<void> {
        if (!this.isLastInput(historyData)) {
            this.lastHistoryData = historyData;
            await this.collection.insertOne(historyData);
        }
    }

    async deleteHistory(): Promise<DeleteResult> {
        return this.collection.deleteMany({});
    }

    private isLastInput(historyData: HistoryData): boolean {
        return (
            historyData.date === this.lastHistoryData.date &&
            historyData.duration === this.lastHistoryData.duration &&
            historyData.mode === this.lastHistoryData.mode
        );
    }
}
