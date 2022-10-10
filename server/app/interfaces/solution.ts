import { PlacedLetter } from '@app/classes/placed-letter';
import { Vec2 } from 'common/classes/vec2';

export interface Solution {
    letters: PlacedLetter[];
    blanks: Vec2[];
    direction: Vec2;
}
