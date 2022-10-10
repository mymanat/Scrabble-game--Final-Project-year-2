/* eslint-disable no-console */
// permet l'utilisation des consoles logs
import { Application } from '@app/app';
import { DECIMAL_BASE } from 'common/constants';
import http from 'http';
import { AddressInfo } from 'net';
import { Container, Service } from 'typedi';
import { HIGHSCORE_DATABASE } from './classes/highscore';
import { BOT_NAME_DATABASE, HISTORY_DATABASE } from './constantes';
import { BotNameDatabaseService } from './services/bot-name-database.service';
import { BotNameService } from './services/bot-name.service';
import { BrowserService } from './services/browser.service';
import { DictionaryService } from './services/dictionary.service';
import { GameConfigService } from './services/game-config.service';
import { HighscoreDatabaseService } from './services/highscore-database.service';
import { HistoryDatabaseService } from './services/history-database.service';
import { RoomsManager } from './services/rooms-manager.service';
import { SocketService } from './services/socket-manager.service';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');

    socketService: SocketService;

    private server: http.Server;

    constructor(private readonly application: Application) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, DECIMAL_BASE) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }
    init() {
        this.application.app.set('port', Server.appPort);
        this.server = http.createServer(this.application.app);
        Container.get(DictionaryService).init();
        Container.get(GameConfigService).init();
        this.socketService = new SocketService(
            this.server,
            Container.get(RoomsManager),
            Container.get(DictionaryService),
            Container.get(BrowserService),
            Container.get(HighscoreDatabaseService),
            Container.get(GameConfigService),
            Container.get(HistoryDatabaseService),
            Container.get(BotNameService),
        );
        Container.get(HighscoreDatabaseService).start(HIGHSCORE_DATABASE.uri);
        Container.get(HistoryDatabaseService).start(HISTORY_DATABASE.uri);
        Container.get(BotNameDatabaseService).start(BOT_NAME_DATABASE.uri);
        console.log(this.socketService.isOpen() ? 'Socket server is open' : 'Socket server is closed');
        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        console.log(`Listening on ${bind}`);
    }
}
