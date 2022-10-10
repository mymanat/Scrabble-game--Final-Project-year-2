import { GameConfig } from '@app/classes/game-config';
import { GameConfigService } from '@app/services/game-config.service';
import { expect } from 'chai';
import { Letter } from 'common/classes/letter';
import { describe } from 'mocha';
import { Container } from 'typedi';

describe('Letter config service', () => {
    let service: GameConfigService;
    beforeEach(() => {
        service = Container.get(GameConfigService);
    });

    it('getConfigFromName with "Classic" as input should return the classic letter config', () => {
        const config = service.getConfigFromName('Classic');
        expect(config.name).to.eq('Classic');
        const letterConfigItem = (config as GameConfig).letters.find((l) => l.letter === ('A' as Letter));
        expect(letterConfigItem).to.not.eq(undefined);
        expect(letterConfigItem?.letter).to.eq('A' as Letter);
        expect(letterConfigItem?.points).to.eq(1);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(letterConfigItem?.amount).to.eq(9);
    });

    it('getConfigFromName with invalid input should return an error', () => {
        expect(service.getConfigFromName('a') instanceof Error).to.equal(true);
    });
});
