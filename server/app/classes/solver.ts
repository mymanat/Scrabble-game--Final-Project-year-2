/* eslint-disable max-lines */
/* 
Justification : 
Cette classe a un usage précis et contient un algorithme complexe.
Les fonctions sont très couplés pour des raisons de performance.
*/

import { Line } from '@app/interfaces/line';
import { Segment } from '@app/interfaces/segment';
import { Solution } from '@app/interfaces/solution';
import { Word } from '@app/interfaces/word';
import { Dictionary } from 'common/classes/dictionary';
import { Letter } from 'common/classes/letter';
import { Vec2, vec2ToBoardPosition } from 'common/classes/vec2';
import { BOARD_SIZE, HINT_COUNT, MAX_BOT_PLACEMENT_TIME } from 'common/constants';
import { promisify } from 'util';
import { GameError } from './game.exception';
import { Board } from './game/board';
import { PlacedLetter } from './placed-letter';

// éviter de bloquer la event loop pendant trop longtemps dans les calculs
const immediatePromise: () => Promise<void> = promisify(setImmediate);

const LETTER_X2_DIST = 4;

export class Solver {
    constructor(private dictionary: Dictionary, private board: Board, private easel: Letter[]) {}

    static solutionToCommandArguments(solution: Solution): string {
        let pos = vec2ToBoardPosition(solution.letters[0].position.flip());
        pos += solution.direction.equals(new Vec2(1, 0)) ? 'h' : 'v';

        let lettersString = '';
        for (const letter of solution.letters) {
            if (solution.blanks.find((v) => v.equals(letter.position))) {
                lettersString += letter.letter.toUpperCase();
            } else {
                lettersString += letter.letter.toLowerCase();
            }
        }
        return `${pos} ${lettersString}`;
    }

    async getHints(): Promise<string[]> {
        const expiration = Date.now() + MAX_BOT_PLACEMENT_TIME;
        const solutions: Solution[] = await this.findAllSolutions(expiration);
        if (solutions.length < 1) return [];

        const randomSolutions = this.pickRandomSolutions(solutions);
        return this.solutionsToHints(randomSolutions);
    }

    async getBotSolutions(extendSearch: boolean): Promise<[Solution, number][] | GameError> {
        const result: [Solution, number][] = [];
        const expiration = Date.now() + MAX_BOT_PLACEMENT_TIME;
        const allSolutions: Solution[] = await this.findAllSolutions(expiration);
        if (allSolutions.length < 1) return result;
        if (extendSearch) {
            allSolutions.push(...(await this.findPerpendicularSolutions(expiration, allSolutions)));
        }
        for (const solution of allSolutions) {
            const solutionWithBlanks = solution.letters.map((letter) => {
                if (solution.blanks.find((v) => v.equals(letter.position))) return new PlacedLetter('*', letter.position);
                return letter;
            });
            const wordsCreated = this.board.getAffectedWords(solutionWithBlanks);
            let score = 0;
            let error: GameError | undefined;
            wordsCreated.forEach((word) => {
                const scoreToAdd = this.board.scorePosition(word);
                if (scoreToAdd instanceof GameError) {
                    error = scoreToAdd;
                    return;
                }
                score += scoreToAdd;
            });
            if (error) return error;
            result.push([solution, score]);
        }
        return result;
    }

    private async findAllSolutions(expiration: number): Promise<Solution[]> {
        await immediatePromise();
        if (this.isBoardEmpty()) return this.findFirstSolutions();
        const solutions: Solution[] = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            solutions.push(...this.findLineSolutions(this.board.board[i], i, new Vec2(0, 1)));
            if (Date.now() > expiration) return [];
            await immediatePromise();
        }
        for (let i = 0; i < BOARD_SIZE; i++) {
            const line = this.board.board.reduce((r, v) => [...r, v[i]], []);
            solutions.push(...this.findLineSolutions(line, i, new Vec2(1, 0)));
            if (Date.now() > expiration) return [];
            await immediatePromise();
        }
        return solutions;
    }

    private isBoardEmpty(): boolean {
        return this.board.board[(BOARD_SIZE - 1) / 2][(BOARD_SIZE - 1) / 2] === null;
    }

    // Calcul simplifié pour la première solution
    // Comme il peut y avoir beaucoup de solution au premier tour,
    // certaines vérifications n'ont pas besoin d'être faites.
    private findFirstSolutions(): Solution[] {
        const regex = this.firstSolutionRegex();
        const words = this.dictionary.words.filter((v) => regex.test(v));
        return this.firstSolutionTransform(words);
    }

    private firstSolutionRegex(): RegExp {
        const easelMap: Map<Letter, number> = new Map();
        for (const letter of this.easel) {
            easelMap.set(letter, (easelMap.get(letter) || 0) + 1);
        }
        const blanksCount: number = easelMap.get('*') || 0;
        let lettersString = '';
        const regexParts: string[] = [];
        easelMap.forEach((v, k) => {
            if (k !== '*') {
                regexParts.push(`(?!(?:[^${k}]*${k}){${v + blanksCount + 1}})`);
                lettersString += k;
            }
        });
        if (blanksCount > 0) {
            regexParts.push(`(?!(?:[${lettersString}]*[^${lettersString}]){${blanksCount + 1}})`);
        }
        return new RegExp(`^${regexParts.join('')}.{1,${this.easel.length}}$`, 'i');
    }

    private firstSolutionTransform(words: string[]): Solution[] {
        const direction = new Vec2(1, 0);
        const startingPosition = new Vec2((BOARD_SIZE - 1) / 2, (BOARD_SIZE - 1) / 2);
        const solutions: Solution[] = [];

        words.forEach((word) => {
            const easelTmp = [...this.easel];
            const wordArray: Letter[] = Array.from(word.toUpperCase()) as Letter[];
            const solution: Solution = { letters: [], blanks: [], direction };

            let position: Vec2 = this.firstSolutionShift(direction, startingPosition, wordArray);

            for (const letter of wordArray) {
                let index = easelTmp.indexOf(letter);
                if (index < 0) {
                    index = easelTmp.indexOf('*');
                    if (index < 0) return;
                    solution.blanks.push(position);
                }
                solution.letters.push(new PlacedLetter(letter, position));
                easelTmp.splice(index, 1);
                position = position.add(direction);
            }
            solutions.push(solution);
        });

        return solutions;
    }

    private firstSolutionShift(direction: Vec2, startingPosition: Vec2, wordArray: Letter[]): Vec2 {
        let position = startingPosition.copy();
        if (wordArray.length > LETTER_X2_DIST) {
            let bestLetterScore = 0;
            for (let i = 0; i < wordArray.length - LETTER_X2_DIST; i++) {
                const letterScore = this.board.pointsPerLetter.get(wordArray[i]) as number;
                if (bestLetterScore < letterScore) {
                    bestLetterScore = letterScore;
                    position = startingPosition.add(direction.mul(-LETTER_X2_DIST - i));
                }
            }
            for (let i = LETTER_X2_DIST; i < wordArray.length; i++) {
                const letterScore = this.board.pointsPerLetter.get(wordArray[i]) as number;
                if (bestLetterScore < letterScore) {
                    bestLetterScore = letterScore;
                    position = startingPosition.add(direction.mul(LETTER_X2_DIST - i));
                }
            }
        }
        return position;
    }

    private async findPerpendicularSolutions(expiration: number, solutions: Solution[]): Promise<Solution[]> {
        const extraSolutions: Solution[] = [];

        for (const solution of solutions) {
            // ne pas faire la recherche sur les mots de plus d'une lettre
            if (solution.letters.length !== 1) continue;

            const direction = solution.direction.flip();

            if (Date.now() > expiration) return extraSolutions;
            await immediatePromise();

            const regex = this.perpendicularSolutionRegex(solution);
            if (regex === null) continue;

            const words: Word[] = [];
            const index: number = solution.letters[0].position.dot(direction);

            this.dictionary.words.forEach((v) => {
                const match = regex.exec(v);
                if (match === null) return;
                words.push({ word: match[0], index: index - match[1].length });
            });

            const lines = this.filterDuplicateLetters(new Array(BOARD_SIZE).fill(null), words);

            const lineStart = solution.direction.mul(solution.letters[0].position.dot(solution.direction));
            extraSolutions.push(...this.filterInvalidAffectedWords(lines, direction, lineStart));
        }
        return extraSolutions;
    }

    private perpendicularSolutionRegex(solution: Solution): RegExp | null {
        // direction perpendiculaire
        const direction = solution.direction.flip();

        let k = solution.letters[0].position.sub(direction);
        let backwardSpacing = 0;
        while (k.x >= 0 && k.y >= 0) {
            if (this.board.board[k.x][k.y] !== null) {
                // les mots collés à d'autres sont prit en compte dans les recherche précédentes
                backwardSpacing--;
                break;
            }
            backwardSpacing++;
            k = k.sub(direction);
        }
        // le mot était déjà collé, ignorer
        if (backwardSpacing < 0) return null;

        k = solution.letters[0].position.add(direction);
        let forwardSpacing = 0;
        while (k.x < BOARD_SIZE && k.y < BOARD_SIZE) {
            if (this.board.board[k.x][k.y] !== null) {
                // les mots collés à d'autres sont prit en compte dans les recherche précédentes
                forwardSpacing--;
                break;
            }
            forwardSpacing++;
            k = k.add(direction);
        }
        // le mot était déjà collé, ignorer
        if (forwardSpacing < 0) return null;

        const easelText = this.easel.includes('*') ? 'a-z' : this.easel.join('');

        return new RegExp(
            `(?=^.{2,${this.easel.length + 1}}$)^([${easelText}]{0,${backwardSpacing}})${
                solution.letters[0].letter
            }[${easelText}]{0,${forwardSpacing}}$`,
            'i',
        );
    }

    private pickRandomSolutions(solutions: Solution[]): Solution[] {
        if (solutions.length <= HINT_COUNT) {
            return solutions;
        }
        const randomSolutions: Solution[] = [];
        for (let i = 0; i < HINT_COUNT; i++) {
            const random = Math.floor(((Math.random() + i) * solutions.length) / HINT_COUNT);
            randomSolutions.push(solutions[random]);
        }

        return randomSolutions;
    }

    private solutionsToHints(solutions: Solution[]): string[] {
        const hints: string[] = [];
        for (const solution of solutions) {
            hints.push(`!placer ${Solver.solutionToCommandArguments(solution)}`);
        }
        return hints;
    }

    private findLineSolutions(line: (Letter | null)[], index: number, direction: Vec2): Solution[] {
        if (line.every((letter) => letter === null)) return []; // toutes les lettres sont null

        const segments = this.generateSegments(line);
        const regex = this.generateRegex(segments);
        const searchResults = this.dictionarySearch(regex, segments);
        const placedWords = this.filterDuplicateLetters(line, searchResults);

        const lineStart = direction.flip().mul(index);
        const result = this.filterInvalidAffectedWords(placedWords, direction, lineStart);

        return result;
    }

    private filterInvalidAffectedWords(placedWords: Line[], direction: Vec2, lineStart: Vec2): Solution[] {
        const result: Solution[] = [];
        for (const word of placedWords) {
            const solution: Solution = { letters: [], blanks: [], direction };
            let valid = true;
            for (let i = 0; i < word.letters.length; i++) {
                if (word.letters[i] === null) continue;
                const letterPos = lineStart.add(direction.mul(i));

                let perpendicularWord: string = word.letters[i] as Letter;

                let k = letterPos.sub(direction.flip());
                while (k.x >= 0 && k.y >= 0 && this.board.board[k.x][k.y] !== null) {
                    perpendicularWord = this.board.board[k.x][k.y] + perpendicularWord;
                    k = k.sub(direction.flip());
                }

                k = letterPos.add(direction.flip());
                while (k.x < BOARD_SIZE && k.y < BOARD_SIZE && this.board.board[k.x][k.y] !== null) {
                    perpendicularWord = perpendicularWord + this.board.board[k.x][k.y];
                    k = k.add(direction.flip());
                }

                if (perpendicularWord.length > 1) {
                    if (this.dictionary.words.indexOf(perpendicularWord.toLowerCase()) < 0) {
                        valid = false;
                        break;
                    }
                }

                const placedLetter = new PlacedLetter(word.letters[i] as Letter, letterPos);
                solution.letters.push(placedLetter);
            }
            if (!valid) continue;

            for (const blank of word.blanks) {
                solution.blanks.push(lineStart.add(direction.mul(blank)));
            }

            result.push(solution);
        }
        return result;
    }

    private generateSegments(line: (Letter | null)[]): Segment[] {
        const segments: Segment[] = [];

        let pos = 0;
        while (pos < line.length) {
            while (line[pos] === null && pos < line.length) pos++;
            if (pos === line.length) break;

            const segment: Segment = { start: pos, value: '', end: pos };
            while (line[pos] !== null && pos < line.length) {
                segment.value += line[pos];
                pos++;
            }

            segment.end = pos;
            segments.push(segment);
        }

        return segments;
    }

    private generateRegex(segments: Segment[]): RegExp {
        const easelText = this.easel.includes('*') ? 'a-z' : this.easel.join('');

        const regexParts = [];

        for (let i = 0; i < segments.length; i++) {
            let regexPart = `(?:(?!${segments[i].value}$)`;
            if (segments[i].start !== 0) {
                const left = i === 0 ? segments[i].start : segments[i].start - segments[i - 1].end - 1;
                regexPart += `([${easelText}]{0,${left}}|^)`;
            } else {
                regexPart += '()';
            }

            regexPart += segments[i].value;

            for (let j = i; j < segments.length; j++) {
                if (j + 1 < segments.length) {
                    const spacing = segments[j + 1].start - segments[j].end;
                    regexPart += `(?:[${easelText}]{${spacing - 1}}$|[${easelText}]{${spacing}}${segments[j + 1].value}|$)`;
                } else if (segments[j].end < BOARD_SIZE) {
                    const spacing = BOARD_SIZE - segments[j].end;
                    regexPart += `(?:[${easelText}]{1,${spacing}}|$)`;
                }
            }

            regexPart += ')';
            regexParts.push(regexPart);
        }

        return new RegExp(`^(?:${regexParts.join('|')})$`, 'i');
    }

    private dictionarySearch(regex: RegExp, segments: Segment[]): Word[] {
        const matches: Word[] = [];
        this.dictionary.words.forEach((w) => {
            const match = regex.exec(w);
            if (match) {
                let i = 0;
                while (match[i + 1] === undefined) i++;
                matches.push({ word: w, index: segments[i].start - match[i + 1].length });
            }
        });
        return matches;
    }

    private filterDuplicateLetters(line: (Letter | null)[], words: Word[]): Line[] {
        const matches: Line[] = [];
        words.forEach((w) => {
            const insertedLine: Line = { letters: new Array(BOARD_SIZE).fill(null), blanks: [] };
            insertedLine.letters.splice(w.index, w.word.length, ...(Array.from(w.word.toUpperCase()) as Letter[]));
            const easelTmp = [...this.easel];

            for (let i = w.index; i < w.index + w.word.length; i++) {
                if (line[i] === null) {
                    let index = easelTmp.indexOf(insertedLine.letters[i] as Letter);
                    if (index < 0) {
                        index = easelTmp.indexOf('*');
                        if (index < 0) return;
                        insertedLine.blanks.push(i);
                    }

                    easelTmp.splice(index, 1);
                } else {
                    insertedLine.letters[i] = null;
                }
            }
            matches.push(insertedLine);
        });
        return matches;
    }
}
