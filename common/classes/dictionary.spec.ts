import { expect } from 'chai';
import { Dictionary } from './dictionary';

describe('Dictionary', () => {
    it('getRandomWord should return a random wrd with the length given in parameter', () => {
        const dictionaryWords = ['abc', 'aa', 'bonsoir'];
        const dictionary = new Dictionary('Title', 'Description', dictionaryWords, '');
        expect(dictionary.getRandomWord(3)).to.equal('abc');
        expect(dictionary.getRandomWord(2)).to.equal('aa');
    });
});
