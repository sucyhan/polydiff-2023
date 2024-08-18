import { DB_NAME } from '@app/env';
import { fail } from 'assert';
import { expect } from 'chai';
import { describe } from 'mocha';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spy, stub } from 'sinon';
import { DatabaseService } from './database.service';

describe('Database service', () => {
    let databaseService: DatabaseService;
    let mongoServer: MongoMemoryServer;

    beforeEach(async () => {
        databaseService = new DatabaseService();
        mongoServer = await MongoMemoryServer.create();
    });

    afterEach(async () => {
        if (databaseService['client']) {
            await databaseService['client'].close();
        }
    });

    it('should return db when database getter is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        expect(databaseService.database).to.equal(databaseService['db']);
    });

    it('should connect to the database when start is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        expect(databaseService['client']).to.not.be.equal(undefined);
        expect(databaseService['db'].databaseName).to.equal(DB_NAME);
    });

    it('should not connect to the database when start is called with wrong URL', async () => {
        try {
            await databaseService.start('WRONG URL');
            fail();
        } catch {
            expect(databaseService['client']).to.be.equal(undefined);
        }
    });

    it('should grab the url from the environment variable when start is called without argument', async () => {
        const connectStub = stub(MongoClient.prototype, 'connect');
        const mongoUri = mongoServer.getUri();
        process.env.MONGO_URI = mongoUri;
        await databaseService.start();
        expect(databaseService['client']).to.not.be.equal(undefined);
        expect(databaseService['db'].databaseName).to.equal(DB_NAME);
        connectStub.restore();
    });

    it('should close client connection what closeConnection is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        const closeSpy = spy(databaseService['client'], 'close');
        await databaseService.closeConnection();
        expect(closeSpy.calledOnce).to.equal(true);
    });
});
