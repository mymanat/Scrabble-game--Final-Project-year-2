import { expect } from 'chai';
import { GameOptions } from 'common/classes/game-options';

const DEFAULT_TIME = 60;

describe('GameOptions', () => {
    it('Building works', () => {
        const gameOptions: GameOptions = new GameOptions('test', 'mon dict');
        expect(gameOptions.dictionaryType).to.eq('mon dict');
        expect(gameOptions.hostname).to.eq('test');
        expect(gameOptions.timePerRound).to.eq(DEFAULT_TIME);
    });
});
