import { GameConfig } from '@app/classes/game-config';
import { GameFinishStatus } from '@app/classes/game-finish-status';
import { GameHistoryHandler } from '@app/classes/game-history-handler';
import { GameError, GameErrorType } from '@app/classes/game.exception';
import { Log2990ObjectivesHandler } from '@app/classes/log2990-objectives-handler';
import { PlacedLetter } from '@app/classes/placed-letter';
import { Dictionary } from 'common/classes/dictionary';
import { GameOptions } from 'common/classes/game-options';
import { BLANK_LETTER, Letter } from 'common/classes/letter';
import { Vec2 } from 'common/classes/vec2';
import { GameMode } from 'common/interfaces/game-mode';
import { Bag } from './bag';
import { Board } from './board';
import { Player } from './player';

const MAX_TURNS_SKIPPED = 6;
export const MAX_LETTERS_IN_EASEL = 7;
export const BONUS_POINTS_FOR_FULL_EASEL = 50;
export const MILLISECONDS_PER_SEC = 1000;

export class Game {
    players: Player[];
    board: Board;
    activePlayer: number;
    gameFinished: boolean;
    bag: Bag;
    gameHistory: GameHistoryHandler;
    timerStartTime: number;
    log2990Objectives: Log2990ObjectivesHandler | undefined;

    private turnsSkipped: number;
    private placeCounter: number;
    private currentTimer: NodeJS.Timeout;

    constructor(
        public config: GameConfig,
        public dictionary: Dictionary,
        playerNames: string[],
        private gameOptions: GameOptions,
        private actionAfterTimeout: () => undefined | GameError,
        public actionAfterTurn: () => Promise<undefined | GameError>,
    ) {
        this.bag = new Bag(config);
        this.board = new Board(config, dictionary);
        this.activePlayer = Math.floor(Math.random() * playerNames.length);
        this.players = [];
        this.gameHistory = new GameHistoryHandler();
        playerNames.forEach((name) => this.players.push(new Player(name)));
        this.turnsSkipped = 0;
        this.players.forEach((p) => p.addLetters(this.bag.getLetters(MAX_LETTERS_IN_EASEL)));
        this.placeCounter = 0;
        this.gameFinished = false;
        this.initTimer();
        const creationDelay = 200;
        setTimeout(() => {
            actionAfterTurn();
        }, creationDelay);

        if (gameOptions.gameMode === GameMode.Log2990) this.log2990Objectives = new Log2990ObjectivesHandler(this);
    }

    place(letters: PlacedLetter[], blanks: number[], player: number): GameError | undefined {
        const easelLettersForMove = letters.map((l, index) => {
            if (blanks.filter((b) => b === index).length > 0) return '*' as Letter;
            return l.letter;
        });
        const error = this.checkMove(easelLettersForMove, player);
        if (error) return error;
        if (this.placeCounter === 0) {
            const lettersInCenter = letters.filter((l) =>
                l.position.equals(new Vec2((this.config.boardSize.x - 1) / 2, (this.config.boardSize.y - 1) / 2)),
            );
            if (lettersInCenter.length === 0) return new GameError(GameErrorType.BadStartingMove);
        }

        let scoreToAdd = this.board.place(letters, blanks, this.placeCounter === 0);
        if (scoreToAdd instanceof GameError) return scoreToAdd;
        if (this.log2990Objectives) scoreToAdd = this.log2990Objectives.verifyObjectives(player, letters, scoreToAdd);
        this.getActivePlayer().score += scoreToAdd;
        if (letters.length === MAX_LETTERS_IN_EASEL) this.getActivePlayer().score += BONUS_POINTS_FOR_FULL_EASEL;
        this.getActivePlayer().removeLetters(easelLettersForMove);
        this.getActivePlayer().addLetters(this.bag.getLetters(letters.length));
        if (this.needsToEnd()) this.getActivePlayer().score += this.endGameBonus();
        this.nextTurn();
        this.turnsSkipped = 0;
        this.placeCounter++;
        return;
    }

    draw(letters: Letter[], player: number): GameError | undefined {
        const error = this.checkMove(letters, player);
        if (error) return error;
        this.getActivePlayer().removeLetters(letters);
        this.getActivePlayer().addLetters(this.bag.exchangeLetters(letters));
        this.nextTurn();
        this.turnsSkipped = 0;
        return;
    }

    skip(player: number): GameError | undefined {
        const error = this.checkMove([], player);
        if (error) return error;
        this.nextTurn();
        this.turnsSkipped++;
        return;
    }

    needsToEnd(): boolean {
        if (this.gameFinished) return false;
        if (this.turnsSkipped >= MAX_TURNS_SKIPPED) {
            this.stopTimer();
            return true;
        }
        const lettersInPlayerEasel = this.players.filter((p) => p.easel.length === 0).length > 0;
        const lettersInBagLeft = this.bag.letters.length;
        if (lettersInPlayerEasel && lettersInBagLeft === 0) {
            this.stopTimer();
            return true;
        }
        return false;
    }

    endGame(): GameFinishStatus {
        if (!this.gameFinished) this.endGameScoreAdjustment();
        this.gameFinished = true;
        return this.getGameEndStatus();
    }

    nextTurn(): void {
        this.activePlayer = this.nextPlayer();
    }

    getGameStatus(playerNumber: number, botLevel?: string, withUpdatedTimer: boolean = false): unknown {
        const opponent = { ...this.players[(playerNumber + 1) % 2] };
        opponent.easel = opponent.easel.map(() => BLANK_LETTER);
        return {
            status: {
                activePlayer: this.players[this.activePlayer].name,
                letterPotLength: this.bag.letters.length,
                timer: withUpdatedTimer ? this.timeLeft : this.gameOptions.timePerRound,
            },
            players: { player: this.players[playerNumber], opponent, botLevel },
            board: {
                board: this.board.board,
                pointsPerLetter: Array.from(this.board.pointsPerLetter),
                multipliers: this.board.multipliers,
                blanks: this.board.blanks,
                lastPlacedWord: this.board.lastPlacedWord,
            },
        };
    }

    initTimer(): void {
        this.timerStartTime = Date.now();
        this.currentTimer = setTimeout(this.actionAfterTimeout, this.gameOptions.timePerRound * MILLISECONDS_PER_SEC);
    }

    resetTimer(): void {
        clearTimeout(this.currentTimer);
        this.initTimer();
    }

    stopTimer(): void {
        clearTimeout(this.currentTimer);
    }

    private get timeLeft(): number {
        const timeElapsed = Math.round((Date.now() - this.timerStartTime) / MILLISECONDS_PER_SEC);
        return this.gameOptions.timePerRound - timeElapsed;
    }

    private getGameEndStatus(): GameFinishStatus {
        return new GameFinishStatus(this.players, this.bag.letters.length, this.determineWinner());
    }

    private endGameBonus(): number {
        return this.getNextPlayer()
            .easel.map((l) => this.board.pointsPerLetter.get(l) as number)
            .reduce((sum, n) => sum + n);
    }

    private endGameScoreAdjustment(): void {
        this.players.forEach((p) => {
            p.easel.forEach((l) => {
                p.score -= this.board.pointsPerLetter.get(l) as number;
            });
        });
    }

    private determineWinner(): string | null {
        const playersWithSameScore = this.players.filter((p) => p.score === this.players[0].score);
        if (playersWithSameScore.length === this.players.length) return null;
        const winningPlayer = this.players.reduce((playerWithMostPoints, currentPlayer) =>
            currentPlayer.score > playerWithMostPoints.score ? currentPlayer : playerWithMostPoints,
        );
        return winningPlayer.name;
    }

    private checkMove(letters: Letter[], player: number): GameError | undefined {
        if (player !== this.activePlayer) return new GameError(GameErrorType.WrongPlayer);
        const playerTempEasel = [...this.players[player].easel];
        let letterNotEasel = false;
        letters.forEach((l) => {
            const index = playerTempEasel.indexOf(l);
            if (index < 0) {
                letterNotEasel = true;
                return;
            }
            playerTempEasel.splice(index, 1);
        });
        return letterNotEasel ? new GameError(GameErrorType.LettersAreNotInEasel) : undefined;
    }

    private nextPlayer(): number {
        return (this.activePlayer + 1) % this.players.length;
    }

    private getNextPlayer(): Player {
        return this.players[this.nextPlayer()];
    }

    private getActivePlayer(): Player {
        return this.players[this.activePlayer];
    }
}
