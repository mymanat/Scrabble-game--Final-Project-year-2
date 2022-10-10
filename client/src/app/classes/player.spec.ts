import { Letter } from 'common/classes/letter';
import { Player } from './player';

describe('Player', () => {
    it('should create an instance', () => {
        const player = new Player('Player 1');
        expect(player).toBeTruthy();
        expect(player.name).toEqual('Player 1');
        expect(player.easel).toEqual([]);
        expect(player.score).toEqual(0);
    });

    describe('Easel', () => {
        const letters: Letter[] = ['I', 'U', 'O'];

        let player: Player;

        beforeEach(() => {
            player = new Player('Player 1');
        });

        it('should add letter to easel', () => {
            player.addLettersToEasel(letters);
            expect(player.easel).toEqual(letters);

            player.addLettersToEasel(letters);
            expect(player.easel).toEqual([...letters, ...letters]);
        });

        it('should remove letter from easel', () => {
            player.easel = ['I', 'A', 'O', 'U', 'Y', 'W'];
            player.removeLettersFromEasel(letters);
            expect(player.easel).toEqual(['A', 'Y', 'W']);
        });

        it("shouldn't do anything if the easel doesn't contain the letters to remove", () => {
            player.easel = ['I', 'A', 'O', 'U', 'Y', 'W'];
            player.removeLettersFromEasel(['E', 'H', 'L']);
            expect(player.easel).toEqual(['I', 'A', 'O', 'U', 'Y', 'W']);
        });
    });
});
