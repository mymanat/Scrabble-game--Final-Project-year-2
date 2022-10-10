import { Injectable } from '@angular/core';
import { receivedMessage } from '@app/actions/chat.actions';
import { placeWordSuccess } from '@app/actions/player.actions';
import { Word } from '@app/classes/word';
import { Direction } from '@app/enums/direction';
import { BoardState } from '@app/reducers/board.reducer';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Players } from '@app/reducers/player.reducer';
import { Store } from '@ngrx/store';
import { Letter } from 'common/classes/letter';
import { boardPositionToVec2 } from 'common/classes/vec2';
import { ASCII_ALPHABET_POSITION, BOARD_SIZE, DECIMAL_BASE, EASEL_CAPACITY, POSITION_LAST_CHAR } from 'common/constants';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    constructor(
        private socketService: SocketClientService,
        private playerStore: Store<{ players: Players }>,
        private boardStore: Store<{ board: BoardState }>,
        private statusStore: Store<{ gameStatus: GameStatus }>,
    ) {}

    surrenderGame(): void {
        this.socketService.send('surrender game');
    }

    exchangeLetters(letters: string): void {
        let enoughLetters = false;
        this.statusStore.select('gameStatus').subscribe((status) => (enoughLetters = status.letterPotLength > EASEL_CAPACITY));
        if (!enoughLetters) {
            this.playerStore.dispatch(
                receivedMessage({ username: '', message: 'Commande mal formée - Pas assez de lettres dans la réserve', messageType: 'Error' }),
            );
            return;
        }
        if (this.lettersInEasel(letters)) {
            const commandLine = 'échanger ' + letters;
            this.socketService.send('command', commandLine);
        } else
            this.playerStore.dispatch(
                receivedMessage({ username: '', message: 'Erreur de syntaxe - Lettres pas dans le chevalet', messageType: 'Error' }),
            );
    }

    placeWord(position: string, letters: string): void {
        const command = 'placer';
        const lettersToPlace = this.findLettersToPlace(position, letters);
        if (lettersToPlace === '') {
            this.playerStore.dispatch(
                receivedMessage({ username: '', message: "Commande impossible à réaliser - Lettre à l'extérieur du plateau", messageType: 'Error' }),
            );
            return;
        }
        if (!this.lettersInEasel(letters)) {
            this.playerStore.dispatch(
                receivedMessage({ username: '', message: 'Erreur de syntaxe - Lettres pas dans le chevalet', messageType: 'Error' }),
            );
            return;
        }
        const [boardPosition, direction] = this.separatePosition(position);
        if (!this.wordPlacementCorrect(boardPosition, direction, lettersToPlace)) {
            this.playerStore.dispatch(receivedMessage({ username: '', message: 'Erreur de syntaxe - Mauvais placement', messageType: 'Error' }));
            return;
        }
        const tempWordPlaced = new Word(
            lettersToPlace,
            boardPositionToVec2(boardPosition),
            direction === 'h' ? Direction.HORIZONTAL : Direction.VERTICAL,
        );
        this.boardStore.dispatch(placeWordSuccess({ word: tempWordPlaced }));
        this.socketService.send('command', command + ' ' + position + ' ' + letters);
    }

    lettersInEasel(letters: string): boolean {
        let playerEasel: Letter[] = [];
        this.playerStore.select('players').subscribe((us) => (playerEasel = us.player.easel));
        const easelLetters = JSON.parse(JSON.stringify(playerEasel));
        for (const letter of letters) {
            let letterExist = false;
            for (const element of easelLetters) {
                const equalLetter = element.toString().toLowerCase() === letter;
                const isBlankLetter = element.toString() === '*' && letter === letter.toUpperCase();
                if (equalLetter || isBlankLetter) {
                    easelLetters.splice(easelLetters.indexOf(element), 1);
                    letterExist = true;
                    break;
                }
            }
            if (!letterExist) {
                return false;
            }
        }
        return true;
    }

    getEasel(): Letter[] {
        let playerEasel: Letter[] = [];
        this.playerStore.select('players').subscribe((state) => (playerEasel = state.player.easel));
        return playerEasel;
    }

    letterOnBoard(column: number, line: number): string | undefined {
        let board: (Letter | null)[][] = [];
        this.boardStore.select('board').subscribe((us) => (board = us.board));
        return board[column][line]?.toString().toLowerCase();
    }

    wordPlacementCorrect(position: string, direction: string, letters: string): boolean {
        const column = parseInt(position.slice(1, position.length), DECIMAL_BASE) - 1;
        const line = position.charCodeAt(0) - ASCII_ALPHABET_POSITION;
        let isPlacable = false;
        let board: (Letter | null)[][] = [];
        this.boardStore.select('board').subscribe((us) => (board = us.board));
        for (let i = 0; i < letters.length; ++i) {
            if (direction === 'h') {
                isPlacable ||= this.checkNearSpaces(column + i, line, board);
            } else {
                isPlacable ||= this.checkNearSpaces(column, line + i, board);
            }
            const letterBoard = direction === 'h' ? board[column + i][line] : board[column][line + i];
            if (letterBoard !== null && letterBoard !== undefined) {
                if (letterBoard.toString() !== letters[i].toUpperCase()) {
                    return false;
                } else {
                    isPlacable = true;
                }
            }
        }
        return isPlacable;
    }

    private checkNearSpaces(column: number, line: number, board: (Letter | null)[][]): boolean {
        let isPlacable = false;
        const center = 7;
        if (board[center][center] === null) {
            return column === center && line === center;
        }
        if (column < BOARD_SIZE - 1) isPlacable ||= board[column + 1][line] != null;
        if (line < BOARD_SIZE - 1) isPlacable ||= board[column][line + 1] != null;
        if (column > 0) isPlacable ||= board[column - 1][line] != null;
        if (line > 0) isPlacable ||= board[column][line - 1] != null;
        return isPlacable;
    }

    private findLettersToPlace(position: string, letters: string): string {
        let column = parseInt((position.match(/\d+/) as RegExpMatchArray)[0], DECIMAL_BASE) - 1;
        let line = position.charCodeAt(0) - ASCII_ALPHABET_POSITION;
        let letterPlaced = 0;
        let lettersToPlace = '';
        if (letters.length > 1) {
            while (letterPlaced < letters.length) {
                if (column >= BOARD_SIZE || line >= BOARD_SIZE) {
                    return '';
                }
                const letter = this.letterOnBoard(column, line);
                if (letter) {
                    lettersToPlace += letter;
                } else {
                    lettersToPlace += letters[letterPlaced];
                    letterPlaced++;
                }
                if (position.slice(POSITION_LAST_CHAR) === 'h') {
                    column += 1;
                } else {
                    line += 1;
                }
            }
        } else {
            lettersToPlace = letters;
        }
        return lettersToPlace;
    }

    private separatePosition(position: string): string[] {
        let boardPosition;
        let direction;
        if (/^[vh]$/.test(position.slice(POSITION_LAST_CHAR))) {
            boardPosition = position.slice(0, position.length - 1);
            direction = position.slice(POSITION_LAST_CHAR);
        } else {
            boardPosition = position;
            direction = 'h';
        }
        return [boardPosition, direction];
    }
}
