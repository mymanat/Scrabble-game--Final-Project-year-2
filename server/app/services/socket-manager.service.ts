import http from 'http';
import io from 'socket.io';
import { Service } from 'typedi';
import { BotNameService } from './bot-name.service';
import { BrowserService } from './browser.service';
import { DictionaryService } from './dictionary.service';
import { GameConfigService } from './game-config.service';
import { HighscoreDatabaseService } from './highscore-database.service';
import { HistoryDatabaseService } from './history-database.service';
import { RoomsManager } from './rooms-manager.service';

@Service()
export class SocketService {
    private sio: io.Server;

    constructor(
        server: http.Server,
        public roomManager: RoomsManager,
        public dictionaryService: DictionaryService,
        public browserService: BrowserService,
        public databaseService: HighscoreDatabaseService,
        public configService: GameConfigService,
        public historyDatabaseService: HistoryDatabaseService,
        public botNameService: BotNameService,
    ) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        this.sio.on('connection', (socket) => {
            roomManager.setupSocketConnection(socket);
            dictionaryService.setupSocketConnection(socket);
            browserService.setupSocketConnection(socket);
            databaseService.setupSocketConnection(socket);
            historyDatabaseService.setupSocketConnection(socket);
            botNameService.setUpBotNameSocket(socket);
        });
    }

    isOpen(): boolean {
        return this.sio.getMaxListeners() > 0;
    }

    broadcastMessage(socketValue: string, message: unknown): void {
        this.sio.sockets.emit(socketValue, message);
    }
}
