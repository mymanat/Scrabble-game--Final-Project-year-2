import { GameConfig } from '@app/classes/game-config';
import { GameError, GameErrorType } from '@app/classes/game.exception';
import { PlacedLetter } from '@app/classes/placed-letter';
import { Dictionary } from 'common/classes/dictionary';
import { Letter } from 'common/classes/letter';
import { Multiplier, MultiplierType } from 'common/classes/multiplier';
import { Vec2 } from 'common/classes/vec2';

const ALLOWED_DIRECTIONS = [new Vec2(1, 0), new Vec2(0, 1)];

export const createEmptyMatrix = (dimensions: Vec2) => {
    const matrix = new Array(dimensions.x);
    for (let i = 0; i < dimensions.x; i++) {
        matrix[i] = new Array(dimensions.y);
        for (let j = 0; j < dimensions.y; j++) matrix[i][j] = null;
    }
    return matrix;
};

export class Board {
    board: (Letter | null)[][];
    multipliers: (Multiplier | null)[][];
    pointsPerLetter: Map<Letter, number>;
    blanks: Vec2[];
    lastPlacedWord: Vec2[];

    constructor(private config: GameConfig, private dictionary: Dictionary) {
        this.board = createEmptyMatrix(config.boardSize);
        this.multipliers = createEmptyMatrix(config.boardSize);
        this.pointsPerLetter = new Map();

        config.letters.forEach((l) => this.pointsPerLetter.set(l.letter, l.points));
        config.multipliers.forEach((m) =>
            m.positions.forEach((p) => {
                this.multipliers[p.x][p.y] = m.multiplier;
            }),
        );

        this.blanks = [];
        this.lastPlacedWord = [];
    }

    place(letters: PlacedLetter[], blanks: number[], firstMove: boolean): number | GameError {
        this.lastPlacedWord = [];
        const letterOutOfBoard = letters.filter((l) => l.position.x >= this.config.boardSize.x || l.position.y >= this.config.boardSize.y);
        if (letterOutOfBoard.length > 0) return new GameError(GameErrorType.WrongPosition);
        const words = this.getAffectedWords(letters);
        const allPlacedLetters = words.reduce((arr, currentValue) => [...arr, ...currentValue]);
        if (!firstMove && allPlacedLetters.length === letters.length) return new GameError(GameErrorType.WordNotConnected);

        let wordValid = true;
        words.forEach((w) => {
            if (!this.dictionary.isWord(w.map((l) => l.letter))) wordValid = false;
        });
        if (!wordValid) return new GameError(GameErrorType.InvalidWord);

        letters.forEach((l) => {
            this.board[l.position.x][l.position.y] = l.letter;
            this.lastPlacedWord.push(l.position);
        });

        blanks.forEach((v) => this.blanks.push(letters[v].position.copy()));

        let score = 0;
        let error: GameError | undefined;
        words.forEach((w) => {
            const scoreToAdd = this.scorePosition(w);
            if (scoreToAdd instanceof GameError) {
                error = scoreToAdd;
                return;
            }
            score += scoreToAdd;
        });
        if (error) return error;

        letters.forEach((l) => {
            this.multipliers[l.position.x][l.position.y] = null;
        });

        return score;
    }

    scorePosition(word: PlacedLetter[]): number | GameError {
        let score = 0;
        let multiplier = 1;
        let error: GameError | undefined;
        word.forEach((placedLetter) => {
            const letter = placedLetter.letter;
            if (letter === null || error) {
                error = new GameError(GameErrorType.LetterIsNull);
                return;
            }
            // prends le nombre de points associe a cette lettre
            let letterPoints = this.pointsPerLetter.get(letter) as number;
            // annule s'il s'agit d'un blank
            if (this.blanks.findIndex((p) => p.equals(placedLetter.position)) >= 0) letterPoints = 0;
            // obtient le multiplieur a cette position
            const multi = this.multipliers[placedLetter.position.x][placedLetter.position.y];
            if (multi === null) {
                score += letterPoints;
                return;
            }
            switch (multi.type) {
                case MultiplierType.Letter:
                    score += letterPoints * multi.amount;
                    break;
                case MultiplierType.Word:
                    score += letterPoints;
                    multiplier *= multi.amount;
                    break;
            }
        });
        if (error) return error;
        score *= multiplier;
        return score;
    }

    letterAt(vec: Vec2): Letter | null {
        return this.board[vec.x][vec.y];
    }

    copy(): Board {
        const returnValue = new Board(this.config, this.dictionary);

        this.blanks.forEach((b) => returnValue.blanks.push(b.copy()));

        for (let i = 0; i < this.config.boardSize.x; i++) {
            for (let j = 0; j < this.config.boardSize.y; j++) {
                returnValue.board[i][j] = this.board[i][j];
                returnValue.multipliers[i][j] = this.multipliers[i][j];
            }
        }
        this.pointsPerLetter.forEach((value, key) => {
            returnValue.pointsPerLetter.set(key, value);
        });

        return returnValue;
    }

    getAffectedWords(letters: PlacedLetter[]): PlacedLetter[][] {
        const tempBoard = this.copy();
        letters.forEach((l) => {
            tempBoard.board[l.position.x][l.position.y] = l.letter;
        });

        const words: PlacedLetter[][] = [];

        letters.forEach((l) => {
            ALLOWED_DIRECTIONS.forEach((d) => {
                const word = tempBoard.getAffectedWordFromSinglePlacement(d, l.position);
                if (word.length < 2) return;
                // ajoute s'il n'existe pas
                const index = words.findIndex((w) => {
                    let bool = true;
                    for (let i = 0; i < w.length && i < word.length; i++) bool &&= w[i].equals(word[i]);
                    return bool;
                });
                if (index < 0) words.push(word);
            });
        });

        return words;
    }

    getRandomWord(wordLength: number): string {
        return this.dictionary.getRandomWord(wordLength);
    }

    private getAffectedWordFromSinglePlacement(direction: Vec2, pos: Vec2): PlacedLetter[] {
        let checkingPosition = new Vec2(pos.x, pos.y);
        const word: PlacedLetter[] = [];

        while (!this.positionOutOfBound(checkingPosition) && this.letterAt(checkingPosition) !== null) {
            checkingPosition = checkingPosition.sub(direction);
        }
        checkingPosition = checkingPosition.add(direction);

        while (!this.positionOutOfBound(checkingPosition) && this.letterAt(checkingPosition) !== null) {
            word.push(new PlacedLetter(this.letterAt(checkingPosition) as Letter, checkingPosition.copy()));
            checkingPosition = checkingPosition.add(direction);
        }

        return word;
    }

    private positionOutOfBound(pos: Vec2): boolean {
        return pos.x < 0 || pos.y < 0 || pos.x > this.config.boardSize.x - 1 || pos.y > this.config.boardSize.y - 1;
    }
}
