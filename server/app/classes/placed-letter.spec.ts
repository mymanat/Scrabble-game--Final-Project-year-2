import { expect } from 'chai';
import { Letter } from 'common/classes/letter';
import { Vec2 } from 'common/classes/vec2';
import { PlacedLetter } from './placed-letter';

describe('placed letter', () => {
    let letter: PlacedLetter;
    beforeEach(() => {
        letter = new PlacedLetter('A', new Vec2(0, 0));
    });

    it('constructor', () => {
        expect(letter.position).to.deep.eq(new Vec2(0, 0));
        expect(letter.letter).to.eq('A' as Letter);
    });

    it('copy', () => {
        const copy = letter.copy();
        expect(copy.letter).to.eq(letter.letter);
        expect(copy.position).to.deep.eq(letter.position);
        expect(copy.position).to.not.eq(letter.position);
        expect(copy).to.not.eq(letter);
    });

    it('equals', () => {
        expect(letter.equals(letter.copy())).to.eq(true);
    });
});
