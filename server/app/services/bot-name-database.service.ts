import { BOT_NAME_DATABASE } from '@app/constantes';
import { Db, MongoClient, WithId } from 'mongodb';
import { Container, Service } from 'typedi';
import { BotNameService } from './bot-name.service';
import { BotDifficulty } from './bot.service';

@Service()
export class BotNameDatabaseService {
    private botNameDB: Db;
    private client: MongoClient;
    async start(url: string) {
        try {
            const client = new MongoClient(url);
            this.client = client;
            this.botNameDB = client.db(BOT_NAME_DATABASE.botNames.name);

            await this.client.connect();

            const easyBotNames: string[] = await this.getBotNames(BotDifficulty.Easy);
            const hardBotNames: string[] = await this.getBotNames(BotDifficulty.Hard);

            Container.get(BotNameService).setBotNames(easyBotNames, hardBotNames);
        } catch {
            // recevoir message si le base de donnees n'est pas connectee
            throw Error('erreur de connection');
        }
    }

    async closeConnection(): Promise<void> {
        return this.client.close();
    }

    async getBotNames(difficulty: BotDifficulty): Promise<string[]> {
        const botType = difficulty === BotDifficulty.Easy ? 'easyBot' : 'hardBot';
        return this.botNameDB
            .collection(BOT_NAME_DATABASE.botNames.collections[botType])
            .find({})
            .toArray()
            .then((botName: WithId<Document>[]) => {
                return botName.map((name) => (name as unknown as { name: string }).name);
            });
    }

    async addBotName(botDifficulty: BotDifficulty, name: string): Promise<void> {
        const collection = BOT_NAME_DATABASE.botNames.collections[botDifficulty === BotDifficulty.Easy ? 'easyBot' : 'hardBot'];
        this.botNameDB.collection(collection).insertOne({ name });
    }

    async removeBotName(botDifficulty: BotDifficulty, name: string): Promise<void> {
        const collection = BOT_NAME_DATABASE.botNames.collections[botDifficulty === BotDifficulty.Easy ? 'easyBot' : 'hardBot'];
        this.botNameDB.collection(collection).deleteOne({ name });
    }

    async changeName(botDifficulty: BotDifficulty, previousName: string, modifiedName: string): Promise<void> {
        const collection = BOT_NAME_DATABASE.botNames.collections[botDifficulty === BotDifficulty.Easy ? 'easyBot' : 'hardBot'];
        this.botNameDB.collection(collection).updateOne({ name: previousName }, { $set: { name: modifiedName } });
    }

    async resetDB(): Promise<void> {
        await this.botNameDB.collection(BOT_NAME_DATABASE.botNames.collections.easyBot).deleteMany({});
        await this.botNameDB.collection(BOT_NAME_DATABASE.botNames.collections.hardBot).deleteMany({});
    }
}
