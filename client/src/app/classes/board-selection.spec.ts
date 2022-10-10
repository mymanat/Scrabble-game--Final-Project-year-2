import { Direction } from '@app/enums/direction';
import { Vec2 } from 'common/classes/vec2';
import { BoardSelection } from './board-selection';

describe('BoardSelection', () => {
    it('should create an instance', () => {
        const boardSelection = new BoardSelection();
        expect(boardSelection).toBeTruthy();
        expect(boardSelection.cell).toBeNull();
        expect(boardSelection.modifiedCells).toEqual([]);
        expect(boardSelection.orientation).toBeNull();
    });

    it('should create a clone of the selection', () => {
        const boardSelection = new BoardSelection(new Vec2(1, 1), Direction.HORIZONTAL, [new Vec2(0, 1)]);
        let cloneSelection = boardSelection.copy();

        expect(cloneSelection.cell).not.toBe(boardSelection.cell);
        expect(cloneSelection.cell).toEqual(boardSelection.cell);
        expect(cloneSelection.modifiedCells).not.toBe(boardSelection.modifiedCells);
        expect(cloneSelection.modifiedCells).toEqual(boardSelection.modifiedCells);
        expect(cloneSelection.orientation).toEqual(boardSelection.orientation);

        boardSelection.cell = null;
        cloneSelection = boardSelection.copy();
        expect(cloneSelection.cell).toBeNull();
    });
});
