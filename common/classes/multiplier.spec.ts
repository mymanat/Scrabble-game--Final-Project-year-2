import { expect } from 'chai';
import { Multiplier, MultiplierType } from './multiplier';

describe('multiplier', () => {
    it('equals', () => {
        const a = new Multiplier(2, MultiplierType.Letter);
        expect(a.copy()).to.deep.eq(a);
    });
});
