import { HISTORY_DATABASE } from '@app/constantes';
import { Server } from '@app/server';
import { GameHistory } from 'common/interfaces/game-history';
import { Db, MongoClient, WithId } from 'mongodb';
import io from 'socket.io';
import { Container, Service } from 'typedi';

@Service()
export class HistoryDatabaseService {
    private gameHistoryDB: Db;
    private client: MongoClient;
    async start(url: string) {
        try {
            const client = new MongoClient(url);
            this.client = client;
            this.gameHistoryDB = client.db(HISTORY_DATABASE.gameHistory.name);

            await this.client.connect();
        } catch {
            // recevoir message si le base de donnees n'est pas connectee
            throw Error('erreur de connection');
        }
    }

    async closeConnection(): Promise<void> {
        return this.client.close();
    }

    async getGameHistory(): Promise<GameHistory[]> {
        return this.gameHistoryDB
            .collection(HISTORY_DATABASE.gameHistory.collections.data)
            .find({})
            .sort({ date: -1 })
            .toArray()
            .then((element: WithId<Document>[]) => {
                return element.map((s) => s as unknown as GameHistory);
            });
    }

    async addGameHistory(gameHistory: GameHistory): Promise<void> {
        const collection = HISTORY_DATABASE.gameHistory.collections.data;
        await this.gameHistoryDB.collection(collection).insertOne(gameHistory);
        this.getGameHistory().then((value) => {
            Container.get(Server).socketService.broadcastMessage('receive gameHistory', value);
        });
    }

    async resetDB() {
        await this.gameHistoryDB.collection(HISTORY_DATABASE.gameHistory.collections.data).deleteMany({});
    }

    setupSocketConnection(socket: io.Socket) {
        socket.on('get gameHistory', () => {
            this.getGameHistory().then((value) => {
                socket.emit('receive gameHistory', value);
            });
        });
        socket.on('reset gameHistory', async () => {
            await this.resetDB();
            this.getGameHistory().then((value) => {
                Container.get(Server).socketService.broadcastMessage('receive gameHistory', value);
            });
        });
    }
}
