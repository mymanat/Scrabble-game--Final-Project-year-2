import { Letter, lettersToString } from 'common/classes/letter';

export class Dictionary {
    constructor(public title: string, public description: string, public words: string[], public path: string) {}

    isWord(word: Letter[]): boolean {
        return this.getMatchingWords(word).length > 0;
    }

    getMatchingWords(word: Letter[]): string[] {
        return this.words.filter((w) => new RegExp('^'.concat(lettersToString(word).toLowerCase().replace('*', '.').concat('$'))).test(w));
    }

    getRandomWord(wordLength: number): string {
        const correspondingWords = this.words.filter((word) => word.length === wordLength);
        const index = Math.floor(Math.random() * correspondingWords.length);
        return correspondingWords[index];
    }
}
