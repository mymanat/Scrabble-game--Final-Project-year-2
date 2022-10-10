import { BoardSelection } from '@app/classes/board-selection';
import { PlacedLetter } from '@app/interfaces/placed-letter';
import { BoardState } from '@app/reducers/board.reducer';
import { Vec2 } from 'common/classes/vec2';
import { BoardToListPipe } from './board-to-list.pipe';

describe('BoardToListPipe', () => {
    let pipe: BoardToListPipe;
    beforeEach(() => {
        pipe = new BoardToListPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return list of placed letters', () => {
        const boardState: BoardState = {
            board: [
                ['A', null],
                [null, 'B'],
            ],
            pointsPerLetter: new Map(),
            multipliers: [],
            blanks: [{ x: 1, y: 1 }],
            lastPlacedWord: [{ x: 0, y: 0 }],
            selection: new BoardSelection(),
        };

        const expected: PlacedLetter[] = [
            { letter: 'A', position: new Vec2(0, 0), lastPlacedWord: pipe.colorForLastWord, blank: false },
            { letter: 'B', position: new Vec2(1, 1), lastPlacedWord: undefined, blank: true },
        ];
        const result = pipe.transform(boardState);
        expect(result).toEqual(expected);
    });

    it('should return empty list of placed letters', () => {
        const result = pipe.transform(null);
        expect(result).toEqual([]);
    });
});
