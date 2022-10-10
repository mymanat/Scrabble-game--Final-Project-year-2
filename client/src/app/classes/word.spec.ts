import { Direction } from '@app/enums/direction';
import { Vec2 } from 'common/classes/vec2';
import { Word } from './word';

describe('Word', () => {
    it('should create an instance', () => {
        expect(new Word('allo', new Vec2(0, 0), Direction.HORIZONTAL)).toBeTruthy();
    });

    it('should return the word length', () => {
        const word = new Word('allo', new Vec2(0, 0), Direction.HORIZONTAL);
        expect(word.length()).toEqual('allo'.length);
    });
});
