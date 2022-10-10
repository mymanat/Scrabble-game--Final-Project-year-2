import { Letter } from 'common/classes/letter';

export interface Line {
    letters: (Letter | null)[];
    blanks: number[];
}
