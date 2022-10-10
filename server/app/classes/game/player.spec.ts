import { GameError } from '@app/classes/game.exception';
import { expect } from 'chai';
import { Letter } from 'common/classes/letter';
import { Player } from './player';

describe('bag constructor', () => {
    let player: Player;

    beforeEach(() => {
        player = new Player('default player');
    });

    it('constructor', () => {
        expect(player.name).to.eq('default player');
        expect(player.easel).to.deep.eq([]);
        expect(player.score).to.eq(0);
    });

    it('add letters should add the letters to player easel', () => {
        const lettersToAdd: Letter[] = ['A', 'A', 'A', 'A'];
        player.addLetters(lettersToAdd);
        expect(player.easel).to.deep.eq(lettersToAdd);
    });

    it('remove letters removes letters on correct call', () => {
        player.addLetters(['A', 'A', 'B', 'C', 'A', 'A']);
        player.removeLetters(['A', 'A', 'B', 'A']);
        expect(player.easel).to.deep.eq(['C', 'A']);
    });

    it('remove letters return an error on incorrect call', () => {
        const lettersToAdd: Letter[] = ['A', 'A', 'A', 'A'];
        expect(player.removeLetters(lettersToAdd) instanceof GameError).to.equal(true);
    });

    it('canRemoveLetter returns true when the letters are present in easel', () => {
        const lettersToAdd: Letter[] = ['A', 'A', 'A', 'A'];
        player.addLetters(lettersToAdd);
        expect(player.canRemoveLetters(lettersToAdd)).to.eq(true);
    });
});
