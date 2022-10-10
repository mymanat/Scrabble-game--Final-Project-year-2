import { expect } from 'chai';
import { Vec2 } from 'common/classes/vec2';
import { GameConfig } from './game-config';

describe('GameConfig', () => {
    it('GameConfig default constructor', () => {
        const config = new GameConfig();
        expect(config.multipliers).to.deep.eq([]);
        expect(config.letters).to.deep.eq([]);
        expect(config.boardSize).to.deep.eq(new Vec2(0, 0));
        expect(config.name).to.eq('default');
    });
});
