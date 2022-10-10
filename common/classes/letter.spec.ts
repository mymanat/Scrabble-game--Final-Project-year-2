import { expect } from 'chai';
import { describe } from 'mocha';
import { Letter, lettersToString, stringToLetter, stringToLetters } from './letter';

describe('stringToLetter', () => {
    it('should be equal to its correct character', () => {
        expect(stringToLetter('a')).to.eq('A' as Letter);
    });
});

describe('lettersToString', () => {
    it('should be equal to its equivalent string', () => {
        expect(lettersToString(['A' as Letter])).to.eq('A');

        expect(lettersToString(stringToLetters('zythums'))).to.eq('ZYTHUMS');

        const letter: Letter[] = ['Z', 'Y', 'T', 'H', 'U', 'M', 'S'];
        expect(lettersToString(letter)).to.eq('ZYTHUMS');
    });
});
