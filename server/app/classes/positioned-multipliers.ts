import { Multiplier } from 'common/classes/multiplier';
import { Vec2 } from 'common/classes/vec2';

export class PositionedMultipliers {
    constructor(public multiplier: Multiplier, public positions: Vec2[]) {}
}
