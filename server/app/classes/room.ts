import { BotNameService } from '@app/services/bot-name.service';
import { BotDifficulty, BotService } from '@app/services/bot.service';
import { CommandService } from '@app/services/command.service';
import { DictionaryService } from '@app/services/dictionary.service';
import { GameConfigService } from '@app/services/game-config.service';
import { HighscoreDatabaseService } from '@app/services/highscore-database.service';
import { HistoryDatabaseService } from '@app/services/history-database.service';
import { RoomsManager } from '@app/services/rooms-manager.service';
import { Dictionary } from 'common/classes/dictionary';
import { GameOptions } from 'common/classes/game-options';
import { RoomInfo } from 'common/classes/room-info';
import { MIN_BOT_PLACEMENT_TIME } from 'common/constants';
import { GameMode } from 'common/interfaces/game-mode';
import io from 'socket.io';
import { Container } from 'typedi';
import { GameFinishStatus } from './game-finish-status';
import { GameError, GameErrorType } from './game.exception';
import { Game } from './game/game';
import { Log2990ObjectivesHandler } from './log2990-objectives-handler';

export class Room {
    started: boolean;
    clients: (io.Socket | null)[];
    game: Game | null;
    sockets: io.Socket[];
    commandService: CommandService;

    private clientName: string | null;
    private botLevel: string | undefined;
    private playersLeft: number;

    constructor(public host: io.Socket, private manager: RoomsManager, private gameOptions: GameOptions) {
        this.clients = new Array(1);
        this.started = false;
        this.host.once('quit', () => this.quitRoomHost());
        this.host.once('switch to solo room', (data) => {
            this.initSoloGame(data.botLevel);
            this.host.emit('switched to solo', this.getRoomInfo());
        });
        this.game = null;
        this.clientName = null;
        this.commandService = Container.get(CommandService);
        this.botLevel = undefined;
        this.playersLeft = 2;
    }

    join(socket: io.Socket, name: string): void {
        this.host.emit('player joining', name);
        this.clientName = name;
        this.clients[0] = socket;
        const client = socket;
        this.host.once('accept', () => this.inviteAccepted(client));
        this.host.once('refuse', () => this.inviteRefused(client));
        client.once('cancel join room', () => this.quitRoomClient());
    }

    removeUnneededListeners(socket: io.Socket): void {
        socket
            .removeAllListeners('send message')
            .removeAllListeners('surrender game')
            .removeAllListeners('get game status')
            .removeAllListeners('command');
    }

    getRoomInfo(): RoomInfo {
        return new RoomInfo(this.host.id, this.gameOptions);
    }

    quitRoomClient(): void {
        if (this.game !== null) return;
        this.host.emit('player joining cancel');
        this.clients[0] = null;
        this.clientName = null;
    }

    initiateRoomEvents() {
        this.sockets = [this.host as io.Socket];
        if (this.clients[0]) this.sockets.push(this.clients[0]);
        this.sockets.forEach((s, i) => {
            this.setupSocket(s, i);
        });
        this.sendObjectives();
    }

    initGame(): void {
        this.sockets = [this.host, this.clients[0] as io.Socket];

        this.game = new Game(
            Container.get(GameConfigService).configs[0],
            Container.get(DictionaryService).getDictionary(this.gameOptions.dictionaryType) as Dictionary,
            [this.gameOptions.hostname, this.clientName as string],
            this.gameOptions,
            this.actionAfterTimeout(),
            async () => {
                return undefined;
            },
        );

        this.manager.removeSocketFromJoiningList(this.sockets[1]);
        this.manager.notifyAvailableRoomsChange();

        this.initiateRoomEvents();
    }

    surrenderGame(looserId: string): GameError | undefined {
        if (!this.game?.players) return new GameError(GameErrorType.GameNotExists);
        if (!this.botLevel) {
            this.convertToSolo(looserId === this.host.id ? 0 : 1);
            return;
        }
        const winnerName = looserId === this.host.id ? this.clientName : this.gameOptions.hostname;
        const oldGameStatus = this.game.gameFinished;
        this.game.stopTimer();
        this.game.endGame();
        const looserName = looserId === this.host.id ? this.gameOptions.hostname : this.clientName;
        const surrenderMessage = looserName + ' à abandonné la partie';
        const gameFinishStatus: GameFinishStatus = new GameFinishStatus(this.game.players, this.game.bag.letters.length, winnerName);
        const game = this.game as Game;
        const gameMode = game.log2990Objectives ? GameMode.Log2990 : GameMode.Classical;
        this.sockets.forEach((socket, index) => {
            if (looserName !== game.players[index].name) {
                const highscore = { name: game.players[index].name, score: game.players[index].score };
                Container.get(HighscoreDatabaseService).updateHighScore(highscore, gameMode);
            }
            socket.emit('turn ended');
            socket.emit('receive message', { username: '', message: surrenderMessage, messageType: 'System' });
            socket.emit('end game', gameFinishStatus.toEndGameStatus(index));
        });
        if (--this.playersLeft <= 0) {
            this.manager.removeRoom(this);
        }
        if (!oldGameStatus) {
            const gameHistory = this.game.gameHistory.createGameHistoryData(this.game.players, true, gameMode);
            Container.get(HistoryDatabaseService).addGameHistory(gameHistory);
        }
        return;
    }

    initSoloGame(diff: BotDifficulty): void {
        this.sockets = [this.host];
        this.playersLeft--;

        const botName = Container.get(BotNameService).getBotName(diff, this.gameOptions.hostname);
        this.game = new Game(
            Container.get(GameConfigService).configs[0],
            Container.get(DictionaryService).getDictionary(this.gameOptions.dictionaryType) as Dictionary,
            [this.gameOptions.hostname, botName],
            this.gameOptions,
            this.actionAfterTimeout(),
            this.actionAfterTurnWithBot(this, diff),
        );

        this.manager.notifyAvailableRoomsChange();
        this.setupSocket(this.sockets[0], 0);
        this.botLevel = diff;
        this.sendObjectives();
    }

    quitRoomHost(): void {
        if (this.clients[0]) this.inviteRefused(this.clients[0]);
        this.host.removeAllListeners('switch to solo room');
        this.manager.removeRoom(this);
        this.manager.notifyAvailableRoomsChange();
    }

    private convertToSolo(looserPlayerNumber: number): void {
        this.playersLeft--;
        this.sockets.splice(looserPlayerNumber, 1);
        this.botLevel = BotDifficulty.Easy;
        const game = this.game as Game;
        if (looserPlayerNumber === 0) {
            [game.players[0], game.players[1]] = [game.players[1], game.players[0]];
            game.activePlayer = (game.activePlayer + 1) % 2;
            game.log2990Objectives?.switchingPlayersObjectives();
        }
        game.actionAfterTurn = this.actionAfterTurnWithBot(this, BotDifficulty.Easy);
        const surrenderMessage = game.players[1].name + ' à abandonné, conversion en partie solo débutant';
        this.sockets[0].emit('receive message', { username: '', message: surrenderMessage, messageType: 'System' });
        game.players[1].name = Container.get(BotNameService).getBotName(BotDifficulty.Easy, game.players[0].name);
        this.sockets[0].emit('game status', game.getGameStatus(0, this.botLevel, true));
        this.removeUnneededListeners(this.sockets[0]);
        this.setupSocket(this.sockets[0], 0);
        if (game.activePlayer === 1) game.actionAfterTurn();
    }

    private sendObjectives(): void {
        if (!this.game?.log2990Objectives) return;
        const log2990Objectives = this.game.log2990Objectives as Log2990ObjectivesHandler;
        this.sockets.forEach((socket, index) => {
            const objectiveList = [...log2990Objectives.retrieveLog2990Objective(index)];
            socket.emit('log2990 objectives', { publicObjectives: objectiveList.splice(0, 2), privateObjectives: objectiveList });
        });
    }

    private inviteAccepted(client: io.Socket): void {
        client.emit('accepted');
        this.initGame();
    }

    private inviteRefused(client: io.Socket): void {
        client.emit('refused');
        this.clients[0] = null;
        this.clientName = null;
    }
    private setupSocket(socket: io.Socket, playerNumber: number): void {
        const game = this.game as Game;
        socket.on('get game status', () => {
            socket.emit('game status', game.getGameStatus(playerNumber, this.botLevel));
        });

        // Initialise le traitement des commandes
        socket.on('command', async (command) => await this.commandService.onCommand(this.game as Game, this.sockets, command, playerNumber));

        // Initialise le chat
        socket.on('send message', ({ username, message, messageType }) => {
            this.sockets.forEach((s, i) => {
                if (i !== playerNumber) s.emit('receive message', { username, message, messageType });
            });
            if (!(message.includes(' a quitté le jeu') && messageType === 'System')) return;
            if (--this.playersLeft > 0) return;
            this.manager.removeRoom(this);
        });

        // Initialise l'abbandon de la partie
        socket.on('surrender game', () => {
            return this.surrenderGame(socket.id);
        });
    }

    private actionAfterTurnWithBot(room: Room, diff: BotDifficulty): () => Promise<undefined | GameError> {
        return async () => {
            const game = this.game as Game;
            if (game.activePlayer === 1 && !game.gameFinished) {
                let date = new Date();
                const startDate = date.getTime();
                const botService = Container.get(BotService);
                const botCommand = await botService.move(game, diff);
                if (botCommand instanceof GameError) return botCommand;
                date = new Date();
                const timeTaken = date.getTime() - startDate;
                setTimeout(() => {
                    room.commandService.onCommand(game, room.sockets, botCommand, 1);
                }, Math.max(MIN_BOT_PLACEMENT_TIME - timeTaken, 0));
            }
            return;
        };
    }

    private actionAfterTimeout(): () => undefined {
        return this.commandService.actionAfterTimeout(this);
    }
}
