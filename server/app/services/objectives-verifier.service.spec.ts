/* eslint-disable dot-notation */
import { Game } from '@app/classes/game/game';
import { PlacedLetter } from '@app/classes/placed-letter';
import { expect } from 'chai';
import { restore } from 'sinon';
import { ObjectivesVerifierService } from './objectives-verifier.service';

describe('Objectives Verifier Service', () => {
    let service: ObjectivesVerifierService;

    beforeEach(async () => {
        service = new ObjectivesVerifierService();
    });

    afterEach(() => {
        restore();
    });

    it('verifyFirstObjective should return one if the word is not 4 letters long', () => {
        const words: PlacedLetter[][] = [[{ letter: 'A' } as PlacedLetter]];
        expect(service.verifyFirstObjective(words)).to.equal(1);
    });
    it('verifyFirstObjective should return one if the word is not a palindrome', () => {
        const words: PlacedLetter[][] = [
            [{ letter: 'A' } as PlacedLetter, { letter: 'B' } as PlacedLetter, { letter: 'C' } as PlacedLetter, { letter: 'D' } as PlacedLetter],
        ];
        expect(service.verifyFirstObjective(words)).to.equal(1);
    });
    it('verifyFirstObjective should return two if the word is a palindrome', () => {
        const words: PlacedLetter[][] = [
            [{ letter: 'A' } as PlacedLetter, { letter: 'B' } as PlacedLetter, { letter: 'B' } as PlacedLetter, { letter: 'A' } as PlacedLetter],
        ];
        expect(service.verifyFirstObjective(words)).to.equal(2);
    });

    it('isEqualWord should return true if both words are equal', () => {
        const word: PlacedLetter[] = [
            { letter: 'A' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'A' } as PlacedLetter,
        ];
        expect(service['isEqualWord'](word, word)).to.equal(true);
    });
    it('isEqualWord should return false if both words are not the same length', () => {
        const word: PlacedLetter[] = [
            { letter: 'A' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'A' } as PlacedLetter,
        ];
        const secondWord: PlacedLetter[] = [{ letter: 'A' } as PlacedLetter];
        expect(service['isEqualWord'](word, secondWord)).to.equal(false);
    });

    it('isEqualWord should return false if both words are not equal', () => {
        const word: PlacedLetter[] = [{ letter: 'C' } as PlacedLetter];
        const secondWord: PlacedLetter[] = [{ letter: 'A' } as PlacedLetter];
        expect(service['isEqualWord'](word, secondWord)).to.equal(false);
    });

    it('verifySecondObjective should return 60 if the placed letters are only consonants and is more than 3 length', () => {
        const expectedResult = 60;
        const words: PlacedLetter[] = [
            { letter: 'C' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'D' } as PlacedLetter,
        ];
        expect(service.verifySecondObjective(words)).to.equal(expectedResult);
    });
    it('verifySecondObjective should return 0 if it is not only consonants placed', () => {
        const expectedResult = 0;
        const words: PlacedLetter[] = [
            { letter: 'C' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'A' } as PlacedLetter,
            { letter: 'D' } as PlacedLetter,
        ];
        expect(service.verifySecondObjective(words)).to.equal(expectedResult);
    });
    it('verifySecondObjective should return 0 if it is not only consonants placed', () => {
        const expectedResult = 0;
        const words: PlacedLetter[] = [
            { letter: 'C' } as PlacedLetter,
            { letter: 'B' } as PlacedLetter,
            { letter: 'A' } as PlacedLetter,
            { letter: 'D' } as PlacedLetter,
        ];
        expect(service.verifySecondObjective(words)).to.equal(expectedResult);
    });

    it('verifySecondObjective should return 0 if there is less than 3 letters placed', () => {
        const expectedResult = 0;
        const words: PlacedLetter[] = [{ letter: 'C' } as PlacedLetter, { letter: 'B' } as PlacedLetter];
        expect(service.verifySecondObjective(words)).to.equal(expectedResult);
    });

    it('verifyThirdObjective should return 0 if there is less than 2 letters placed', () => {
        const expectedResult = 0;
        const words: PlacedLetter[] = [{ letter: 'C' } as PlacedLetter];
        expect(service.verifyThirdObjective(words)).to.equal(expectedResult);
    });
    it('verifyThirdObjective should return 0 if the word does not extend another word', () => {
        const expectedResult = 0;
        const words: PlacedLetter[] = [
            { letter: 'C', position: { x: 0, y: 0 } } as PlacedLetter,
            { letter: 'A', position: { x: 0, y: 1 } } as PlacedLetter,
        ];
        expect(service.verifyThirdObjective(words)).to.equal(expectedResult);
    });
    it('verifyThirdObjective should return 30 if the word extends another word', () => {
        const expectedResult = 30;
        const words: PlacedLetter[] = [
            { letter: 'C', position: { x: 0, y: 0 } } as PlacedLetter,
            { letter: 'A', position: { x: 0, y: 3 } } as PlacedLetter,
        ];
        expect(service.verifyThirdObjective(words)).to.equal(expectedResult);
    });

    it('verifyFourthObjective should return 45 if a 20 point word was written in the first 10 seconds', () => {
        const expectedResult = 45;
        const fakeGame = { timerStartTime: Date.now() } as unknown as Game;
        const letterScore = 30;
        expect(service.verifyFourthObjective(fakeGame, letterScore)).to.equal(expectedResult);
    });
    it('verifyFourthObjective should return 0 if it has been more than 10 second that the turn started', () => {
        const expectedResult = 0;
        const elevenSeconds = 11000;
        const fakeGame = { timerStartTime: Date.now() - elevenSeconds } as unknown as Game;
        const letterScore = 30;
        expect(service.verifyFourthObjective(fakeGame, letterScore)).to.equal(expectedResult);
    });
    it('verifyFourthObjective should return 0 if the score is less than 20', () => {
        const expectedResult = 0;
        const fakeGame = { timerStartTime: Date.now() } as unknown as Game;
        const letterScore = 19;
        expect(service.verifyFourthObjective(fakeGame, letterScore)).to.equal(expectedResult);
    });

    it('verifyFifthObjective should return 70 if two or more letters with 8 or more points are placed', () => {
        const expectedResult = 48;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const fakeGame = { board: { pointsPerLetter: { get: () => 9 } } } as unknown as Game;
        const placedLetters = [
            { letter: 'Y', position: { x: 0, y: 0 } } as PlacedLetter,
            { letter: 'A', position: { x: 0, y: 3 } } as PlacedLetter,
            { letter: 'K', position: { x: 0, y: 3 } } as PlacedLetter,
        ];
        expect(service.verifyFifthObjective(placedLetters, fakeGame)).to.equal(expectedResult);
    });

    it('verifyFifthObjective should return 0 if not enough letters are worth more than 8 points', () => {
        const expectedResult = 0;
        const fakeGame = { board: { pointsPerLetter: { get: () => 2 } } } as unknown as Game;
        const placedLetters = [{ letter: 'A', position: { x: 0, y: 0 } } as PlacedLetter, { letter: 'A', position: { x: 0, y: 3 } } as PlacedLetter];
        expect(service.verifyFifthObjective(placedLetters, fakeGame)).to.equal(expectedResult);
    });

    it('verifySixthObjective should return 50 if one of the word is more than ten letters long', () => {
        const expectedResult = 50;
        const words: PlacedLetter[][] = [
            [
                { letter: 'C', position: { x: 0, y: 0 } } as PlacedLetter,
                { letter: 'A', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'B', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'F', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'E', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'T', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'O', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'P', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'Q', position: { x: 0, y: 3 } } as PlacedLetter,
                { letter: 'K', position: { x: 0, y: 3 } } as PlacedLetter,
            ],
        ];
        expect(service.verifySixthObjective(words)).to.equal(expectedResult);
    });
    it('verifySixthObjective should return 0 if none of the word is more than ten letters long', () => {
        const expectedResult = 0;
        const words: PlacedLetter[][] = [[{ letter: 'C', position: { x: 0, y: 0 } } as PlacedLetter]];
        expect(service.verifySixthObjective(words)).to.equal(expectedResult);
    });
    it('verifySeventhObjective should return 69 if the current player points are 69', () => {
        const expectedResult = 69;
        expect(service.verifySeventhObjective(expectedResult)).to.equal(expectedResult);
    });
    it('verifySeventhObjective should return 0 if the current player points are not 69', () => {
        const expectedResult = 0;
        const playerPoints = 150;
        expect(service.verifySeventhObjective(playerPoints)).to.equal(expectedResult);
    });

    it('verifyEighthObjective should return 0 if the word is not included in the createdWords', () => {
        const expectedResult = 0;
        const words: PlacedLetter[][] = [[{ letter: 'C', position: { x: 0, y: 0 } } as PlacedLetter]];
        const wantedWord = 'abc';
        expect(service.verifyEighthObjective(words, wantedWord)).to.equal(expectedResult);
    });
    it('verifyEighthObjective should return 70 if the word is included in the createdWords', () => {
        const expectedResult = 70;
        const words: PlacedLetter[][] = [
            [
                { letter: 'A', position: { x: 0, y: 0 } } as PlacedLetter,
                { letter: 'B', position: { x: 0, y: 1 } } as PlacedLetter,
                { letter: 'C', position: { x: 0, y: 2 } } as PlacedLetter,
            ],
        ];
        const wantedWord = 'abc';
        expect(service.verifyEighthObjective(words, wantedWord)).to.equal(expectedResult);
    });
});
