import { Direction } from '@app/enums/direction';
import { Vec2 } from 'common/classes/vec2';

export class Word {
    constructor(public letters: string, public position: Vec2, public direction?: Direction) {}

    length(): number {
        return this.letters.length;
    }
}
