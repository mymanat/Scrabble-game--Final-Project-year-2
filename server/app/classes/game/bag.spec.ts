import { GameConfig } from '@app/classes/game-config';
import { GameConfigService } from '@app/services/game-config.service';
import { expect } from 'chai';
import { Letter } from 'common/classes/letter';
import { Container } from 'typedi';
import { Bag } from './bag';

const LETTERS_TO_GET = 7;

describe('bag', () => {
    let bag: Bag;
    let gameConfig: GameConfig;

    beforeEach(async () => {
        await Container.get(GameConfigService).init();
        gameConfig = Container.get(GameConfigService).configs[0];
        bag = new Bag(gameConfig);
    });

    it('constructor', () => {
        expect(bag.letters.length).to.eq(gameConfig.letters.map((l) => l.amount).reduce((sum, amount) => sum + amount));
        expect(bag.letters.filter((l) => l === ('A' as Letter)).length).to.eq(gameConfig.letters.find((l) => l.letter === ('A' as Letter))?.amount);
    });

    it('get letters should return the right amount of letters', () => {
        const baseBagLength = bag.letters.length;
        expect(bag.getLetters(LETTERS_TO_GET).length).to.eq(LETTERS_TO_GET);
        expect(bag.letters.length).to.eq(baseBagLength - LETTERS_TO_GET);
    });

    it('exchange letters should return the right amount of letters', () => {
        const baseBagLength = bag.letters.length;
        expect(bag.exchangeLetters(['A', 'A', 'A', 'A', 'A', 'A', 'A']).length).to.eq(LETTERS_TO_GET);
        expect(bag.letters.length).to.eq(baseBagLength);
    });
});
