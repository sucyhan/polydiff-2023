import { DB_NAME, DB_URL } from '@app/env';
import { Db, MongoClient } from 'mongodb';
import { Service } from 'typedi';

@Service()
export class DatabaseService {
    private db: Db;
    private client: MongoClient;
    get database(): Db {
        return this.db;
    }

    async start(url: string = DB_URL): Promise<void> {
        try {
            this.client = new MongoClient(url);
            await this.client.connect();
            this.db = this.client.db(DB_NAME);
        } catch {
            throw new Error('Database connection error');
        }
    }
    async closeConnection(): Promise<void> {
        return this.client.close();
    }
}
