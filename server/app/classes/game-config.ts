import { LetterConfigItem } from '@app/classes/letter-config-item';
import { Dictionary } from 'common/classes/dictionary';
import { Vec2 } from 'common/classes/vec2';
import { PositionedMultipliers } from './positioned-multipliers';

export class GameConfig {
    dictionary: Dictionary;
    constructor(
        public name: string = 'default',
        public letters: LetterConfigItem[] = [],
        public boardSize: Vec2 = new Vec2(0, 0),
        public multipliers: PositionedMultipliers[] = [],
    ) {}
}
