import { Injectable } from '@angular/core';
import { receivedMessage } from '@app/actions/chat.actions';
import { refreshObjectiveState } from '@app/actions/game-objective.actions';
import { getGameStatus } from '@app/actions/game-status.actions';
import { exchangeLetters, placeWord } from '@app/actions/player.actions';
import { ChatMessage } from '@app/interfaces/chat-message';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Store } from '@ngrx/store';
import { ASCII_ALPHABET_POSITION, BOARD_SIZE, DECIMAL_BASE, HINT_COUNT, POSITION_LAST_CHAR } from 'common/constants';
import { Log2990Objective } from 'common/interfaces/log2990-objectives';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    constructor(
        private store: Store<{ gameStatus: GameStatus }>,
        private socketService: SocketClientService,
        private gameStore: Store<{ gameStatus: GameStatus }>,
    ) {}
    broadcastMsg(username: string, message: string, messageType: string = '') {
        this.socketService.send('send message', { username, message, messageType });
    }

    acceptNewAction(): void {
        this.socketService.on('log2990 objectives', (objectives: { publicObjectives: Log2990Objective[]; privateObjectives: Log2990Objective[] }) => {
            this.store.dispatch(
                refreshObjectiveState({ publicObjectives: objectives.publicObjectives, privateObjectives: objectives.privateObjectives }),
            );
        });
        this.socketService.on('receive message', (chatMessage: ChatMessage) => {
            this.store.dispatch(receivedMessage(chatMessage));
        });
        this.socketService.on('place success', (data: { args: string[]; username: string }) => {
            const chatMessage = { username: data.username, message: '!placer ' + data.args.join(' '), messageType: '' };
            this.store.dispatch(receivedMessage(chatMessage));
        });
        this.socketService.on('draw success', (data: { letters: string; username: string }) => {
            const chatMessage = { username: data.username, message: '!échanger ' + data.letters, messageType: '' };
            this.store.dispatch(receivedMessage(chatMessage));
        });
        this.socketService.on('skip success', (username: string) => {
            const chatMessage = { username, message: '!passer', messageType: '' };
            this.store.dispatch(receivedMessage(chatMessage));
        });
        this.socketService.on('hint success', (data: { hints: string[] }) => {
            let message: string = data.hints.join('\n');
            if (data.hints.length < HINT_COUNT) {
                message = `${data.hints.length} indices trouvés\n` + message;
            }
            const chatMessage = { username: '', message, messageType: 'System' };
            this.store.dispatch(receivedMessage(chatMessage));
        });
        this.socketService.on('turn ended', () => {
            this.store.dispatch(getGameStatus());
        });
        this.socketService.on('error', (errorMessage: string) => {
            const chatMessage = { username: '', message: errorMessage, messageType: 'Error' };
            this.store.dispatch(receivedMessage(chatMessage));
            if (errorMessage !== 'Ce placement crée un mot invalide') {
                this.store.dispatch(getGameStatus());
            }
        });
    }

    messageWritten(username: string, message: string, messageType = ''): void {
        if (message[0] !== '!') {
            this.store.dispatch(receivedMessage({ username, message, messageType }));
            this.broadcastMsg(username, message, messageType);
        } else {
            let activePlayer;
            let gameEnded;
            this.gameStore.select('gameStatus').subscribe((status) => {
                activePlayer = status.activePlayer;
                gameEnded = status.gameEnded;
            });
            if (gameEnded) {
                this.store.dispatch(receivedMessage({ username: '', message: 'La partie est finie', messageType: 'Error' }));
                return;
            }
            const command = message.split(' ');
            if (this.handleNonTurnSpecificCommands(command)) return;

            if (username !== activePlayer) {
                this.store.dispatch(
                    receivedMessage({ username: '', message: "Commande impossible à réaliser - Ce n'est pas votre tour", messageType: 'Error' }),
                );
                return;
            }
            this.handleTurnSpecificCommands(command);
        }
    }

    private handleNonTurnSpecificCommands(command: string[]): boolean {
        switch (command[0]) {
            case '!réserve':
                if (command.length === 1) {
                    this.handleSimpleCommand(command);
                } else {
                    this.store.dispatch(
                        receivedMessage({ username: '', message: 'Erreur de syntaxe - commande réserve mal formée', messageType: 'Error' }),
                    );
                }
                return true;
            case '!aide':
                if (command.length === 1) {
                    this.processHelp();
                } else {
                    this.store.dispatch(
                        receivedMessage({ username: '', message: 'Erreur de syntaxe - commande aide mal formée', messageType: 'Error' }),
                    );
                }
                return true;
        }
        return false;
    }

    private handleTurnSpecificCommands(command: string[]) {
        switch (command[0]) {
            case '!placer':
                this.handlePlaceCommand(command);
                break;
            case '!échanger':
                this.handleExchangeCommand(command);
                break;
            case '!passer':
                if (command.length === 1) {
                    this.handleSimpleCommand(command);
                } else {
                    this.store.dispatch(
                        receivedMessage({ username: '', message: 'Erreur de syntaxe - commande passer mal formée', messageType: 'Error' }),
                    );
                    return;
                }
                break;
            case '!indice':
                this.handleSimpleCommand(command);
                break;
            default:
                this.store.dispatch(receivedMessage({ username: '', message: 'Entrée invalide', messageType: 'Error' }));
                return;
        }
    }

    private handleSimpleCommand(command: string[]): void {
        if (command.length === 1) {
            const commandLine = command[0].slice(1, command[0].length);
            this.socketService.send('command', commandLine);
        } else {
            this.store.dispatch(receivedMessage({ username: '', message: 'Erreur de syntaxe - commande mal formée', messageType: 'Error' }));
            return;
        }
    }

    private handleExchangeCommand(command: string[]): void {
        if (this.validateExchangeCommand(command)) {
            this.store.dispatch(exchangeLetters({ letters: command[1] }));
        } else {
            this.store.dispatch(receivedMessage({ username: '', message: 'Erreur de syntaxe - commande échanger mal formée', messageType: 'Error' }));
            return;
        }
    }

    private handlePlaceCommand(command: string[]): void {
        if (this.validatePlaceCommand(command)) {
            this.store.dispatch(placeWord({ position: command[1], letters: command[2] }));
        } else {
            this.store.dispatch(receivedMessage({ username: '', message: 'Erreur de syntaxe - commande placer mal formée', messageType: 'Error' }));
            return;
        }
    }

    private validatePlaceCommand(command: string[]): boolean {
        let commandIsCorrect = false;
        if (!(command.length === 3)) return false;
        commandIsCorrect = true;
        commandIsCorrect &&= /^[a-o]*$/.test(command[1][0]);
        commandIsCorrect &&= /^[a-z0-9]*$/.test(command[1]);
        commandIsCorrect &&= /^[a-zA-Z]*$/.test(command[2]);
        const columnNumber = parseInt((command[1].match(/\d+/) as RegExpMatchArray)[0], DECIMAL_BASE); // Prend les nombres d'un string
        const minColumnNumber = 1;
        const maxColumnNumber = BOARD_SIZE;
        commandIsCorrect &&= minColumnNumber <= columnNumber && columnNumber <= maxColumnNumber;
        if (command[1].slice(POSITION_LAST_CHAR) === 'h') {
            commandIsCorrect &&= columnNumber - 1 + command[2].length <= BOARD_SIZE;
        } else if (command[1].slice(POSITION_LAST_CHAR) === 'v') {
            commandIsCorrect &&= command[1][0].charCodeAt(0) - ASCII_ALPHABET_POSITION + command[2].length <= BOARD_SIZE;
        }
        if (command[2].length > 1) {
            commandIsCorrect &&= /^[vh]$/.test(command[1].slice(POSITION_LAST_CHAR));
        }
        return commandIsCorrect;
    }

    private validateExchangeCommand(command: string[]): boolean {
        let isValid = true;
        isValid &&= /^[a-z/*]*$/.test(command[1]);
        isValid &&= command.length === 2;
        return isValid;
    }

    private processHelp(): void {
        const helpMessage = 'Commandes: \n'
            .concat('!placer : cette commande permet de placer une à plusieurs lettres\n')
            .concat('ex : !placer h8h vue --> h8 : case sur le plateau, h : direction horizontale, vue : lettres\n')
            .concat('!échanger : cette commande échange une à plusieurs lettres sur votre chevalet\n')
            .concat('ex : !échanger mwb --> remplace les lettres m, w, b sur votre chevalet\n')
            .concat('!passer : cette commande permet de passer son tour\n')
            .concat('!réserve : cette commande permet de voir les lettres dans la réserve et de votre adversaire\n')
            .concat('!indice : cette commande donne des suggestions de lettres à placer\n');

        this.store.dispatch(receivedMessage({ username: '', message: helpMessage, messageType: 'System' }));
    }
}
