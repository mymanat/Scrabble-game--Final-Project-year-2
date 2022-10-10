/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
import { fail } from 'assert';
import { expect } from 'chai';
import { describe } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BotNameDatabaseService } from './bot-name-database.service';
import { BotDifficulty } from './bot.service';

describe('BotName-database service', () => {
    let databaseService: BotNameDatabaseService;
    let mongoServer: MongoMemoryServer;

    beforeEach(async () => {
        databaseService = new BotNameDatabaseService();
        mongoServer = await MongoMemoryServer.create();
    });

    afterEach(async () => {
        if (databaseService['client']) {
            await databaseService['client'].close();
        }
    });

    it('should connect to the database when start is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        expect(databaseService['client']).to.not.be.undefined;
    });

    it('should not connect to the database when databaseConnect is called with the wrong URL', async () => {
        try {
            await databaseService.start('WRONG_URL');
            fail();
        } catch {
            expect(databaseService['client']).to.be.undefined;
        }
    });

    it('should no longer be connected if close is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.closeConnection();
        expect(databaseService['client']).to.not.be.undefined;
    });

    it('should add a bot name with given difficulty', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.addBotName(BotDifficulty.Easy, 'NewBotName');
        const botNames = await databaseService.getBotNames(BotDifficulty.Easy);
        expect(botNames[0]).to.equal('NewBotName');
    });

    it('should reset the database when calling resetDB', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.addBotName(BotDifficulty.Easy, 'NewBotName');
        await databaseService.resetDB();
        const botNames = await databaseService.getBotNames(BotDifficulty.Easy);
        expect(botNames).to.be.empty;
    });
});
