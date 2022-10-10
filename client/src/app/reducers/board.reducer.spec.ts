/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { backspaceSelection, cellClick, clearSelection, placeLetter, removeLetters, syncBoardSuccess } from '@app/actions/board.actions';
import { gameStatusReceived, resetAllState } from '@app/actions/game-status.actions';
import * as playersActions from '@app/actions/player.actions';
import { BoardSelection } from '@app/classes/board-selection';
import { Player } from '@app/classes/player';
import { Word } from '@app/classes/word';
import { Direction } from '@app/enums/direction';
import { Letter } from 'common/classes/letter';
import { Multiplier } from 'common/classes/multiplier';
import { Vec2 } from 'common/classes/vec2';
import { BOARD_SIZE } from 'common/constants';
import { BoardState, initialState, isCellAtBoardLimit, reducer, switchOrientation } from './board.reducer';

const createInitialBoard = () => {
    const initialBoard = new Array(BOARD_SIZE);
    for (let i = 0; i < BOARD_SIZE; ++i) initialBoard[i] = new Array(BOARD_SIZE).fill(null);
    return initialBoard;
};

const createInitialState = () => ({
    board: createInitialBoard(),
    pointsPerLetter: new Map(),
    multipliers: createInitialBoard(),
    blanks: [],
    lastPlacedWord: [],
    selection: new BoardSelection(),
});

describe('[Board] Reducer', () => {
    let boardStub: BoardState;
    let stateStub: BoardState;
    const multiplierValue = 5;

    beforeEach(() => {
        boardStub = createInitialState();
        boardStub.board[5][5] = 'O';
        boardStub.board[5][6] = 'U';
        boardStub.board[5][7] = 'I';

        boardStub.multipliers[0][0] = new Multiplier(multiplierValue);

        stateStub = createInitialState();
    });

    describe('Board selection helper functions', () => {
        it('isCellAtBoardLimit should return true if the given position is the board limit', () => {
            expect(isCellAtBoardLimit(stateStub.board, new Vec2(BOARD_SIZE - 1, 0), Direction.HORIZONTAL)).toBeTruthy();
            expect(isCellAtBoardLimit(stateStub.board, new Vec2(0, BOARD_SIZE - 1), Direction.VERTICAL)).toBeTruthy();

            expect(isCellAtBoardLimit(stateStub.board, new Vec2(0, BOARD_SIZE - 1), Direction.HORIZONTAL)).toBeFalsy();
            expect(isCellAtBoardLimit(stateStub.board, new Vec2(BOARD_SIZE - 1, 0), Direction.VERTICAL)).toBeFalsy();
        });

        it('isCellAtBoardLimit should return true if the given position is the board limit', () => {
            boardStub.board[BOARD_SIZE - 1][0] = 'A';
            boardStub.board[0][BOARD_SIZE - 1] = 'A';

            expect(isCellAtBoardLimit(boardStub.board, new Vec2(BOARD_SIZE - 2, 0), Direction.HORIZONTAL)).toBeTruthy();
            expect(isCellAtBoardLimit(boardStub.board, new Vec2(0, BOARD_SIZE - 2), Direction.VERTICAL)).toBeTruthy();
        });

        it('switchOrientation should switch the Orientation', () => {
            let orientation = Direction.HORIZONTAL;

            orientation = switchOrientation(orientation);
            expect(orientation).toEqual(Direction.VERTICAL);

            orientation = switchOrientation(orientation);
            expect(orientation).toEqual(Direction.HORIZONTAL);
        });

        it('switchOrientation should return horizontal as default if the orientation was null', () => {
            expect(switchOrientation(null)).toEqual(Direction.HORIZONTAL);
        });
    });

    describe('[Board] Sync Board', () => {
        it('should sync the state with the new board', () => {
            const action = syncBoardSuccess({ newBoard: boardStub.board });

            stateStub.multipliers[0][0] = new Multiplier(multiplierValue);
            const result = reducer(stateStub, action);

            expect(result).toEqual(boardStub);
        });
    });

    describe('[Game Status] Game Status Received', () => {
        it('should set the board state com', () => {
            const action = gameStatusReceived({
                status: { activePlayer: '', winner: null, gameEnded: false, letterPotLength: 0, timer: 0 },
                players: { player: new Player(''), opponent: new Player('') },
                board: boardStub,
            });

            const result = reducer(stateStub, action);

            expect(result).toEqual(boardStub);
        });
    });

    describe('[Players] Place Word Success', () => {
        it('should add the word in the board horizontally and remove multipliers', () => {
            const newWord = new Word('alloA', new Vec2(0, 0), Direction.HORIZONTAL);
            const action = playersActions.placeWordSuccess({ word: newWord });

            const result = reducer(boardStub, action);

            for (let x = newWord.position.x; x < newWord.length(); ++x) {
                expect(result.board[x][0]).toEqual(newWord.letters[x].toUpperCase() as Letter);
                expect(result.multipliers[x][0]).toEqual(null);
            }
            expect(result.blanks[0]).toEqual(new Vec2(4, 0));
        });

        it('should add the word in the board vertically and remove multipliers', () => {
            const newWord = new Word('alloA', new Vec2(0, 0), Direction.VERTICAL);
            const action = playersActions.placeWordSuccess({ word: newWord });

            const result = reducer(boardStub, action);

            for (let y = newWord.position.y; y < newWord.length(); ++y) {
                expect(result.board[0][y]).toEqual(newWord.letters[y].toUpperCase() as Letter);
                expect(result.multipliers[0][y]).toEqual(null);
            }
            expect(result.blanks[0]).toEqual(new Vec2(0, 4));
        });
    });

    describe('[Game Status] Reset All State', () => {
        it('should reset to initial state', () => {
            const action = resetAllState();
            const result = reducer(boardStub, action);

            expect(result).toEqual(initialState);
        });
    });

    describe('[Board] Cell Clicked', () => {
        it('should select a cell if last selection was null', () => {
            const cellLocation = new Vec2(5, 5);
            const action = cellClick({ pos: cellLocation });
            const result = reducer(boardStub, action);

            expect(result.selection.cell).toEqual(cellLocation);
        });

        it('should set the selection direction to horizontal and then switch every time you click on the same cell', () => {
            const action = cellClick({ pos: new Vec2(5, 5) });

            let result = reducer(boardStub, action);
            expect(result.selection.orientation).toEqual(Direction.HORIZONTAL);

            result = reducer(result, action);
            expect(result.selection.orientation).toEqual(Direction.VERTICAL);

            result = reducer(result, action);
            expect(result.selection.orientation).toEqual(Direction.HORIZONTAL);
        });

        it('should set the orientation directly to vertical if the selected cell is at the horizontal board limit', () => {
            const action = cellClick({ pos: new Vec2(BOARD_SIZE - 1, 0) });

            const result = reducer(boardStub, action);
            expect(result.selection.orientation).toEqual(Direction.VERTICAL);
        });

        it('should set the orientation to null if the selected cell is at the horizontal and vertical board limit', () => {
            const action = cellClick({ pos: new Vec2(BOARD_SIZE - 1, BOARD_SIZE - 1) });

            const result = reducer(boardStub, action);
            expect(result.selection.orientation).toBeNull();
        });

        it("shouldn't do anything if some cells were already modified", () => {
            const action = cellClick({ pos: new Vec2(5, 5) });
            boardStub.selection.modifiedCells.push(new Vec2(4, 6));

            const result = reducer(boardStub, action);
            expect(result).toBe(boardStub);
        });
    });

    describe('[Board] Letter Placed', () => {
        const action = placeLetter({ letter: 'A', isBlank: false });
        let initialSelectionPosition: Vec2;

        beforeEach(() => {
            initialSelectionPosition = new Vec2(6, 6);
            boardStub.selection = new BoardSelection(initialSelectionPosition, Direction.HORIZONTAL, []);
        });

        it('should add the selected cell in the modified cells', () => {
            const result = reducer(boardStub, action);

            expect(result.selection.modifiedCells.length).toEqual(1);
            expect(result.selection.modifiedCells[0]).toEqual(boardStub.selection.cell as Vec2);
        });

        it('should increment the selected cell position in the right direction', () => {
            // Horizontal
            let result = reducer(boardStub, action);

            let expectedNewPosition = initialSelectionPosition;
            expectedNewPosition.x++;
            expect(result.selection.cell).toEqual(expectedNewPosition);

            // Vertical
            boardStub.selection.orientation = Direction.VERTICAL;
            result = reducer(boardStub, action);

            expectedNewPosition = initialSelectionPosition;
            expectedNewPosition.y++;

            expect(result.selection.cell).toEqual(expectedNewPosition);
        });

        it('should set the letter in the board', () => {
            const result = reducer(boardStub, action);

            expect(result.board[initialSelectionPosition.x][initialSelectionPosition.y]).toEqual(action.letter);
        });

        it("shouldn't do anything if the selected cell contains a letter or no cell were selected", () => {
            boardStub.selection.cell = new Vec2(5, 5);
            let result = reducer(boardStub, action);

            expect(result).toBe(boardStub);

            boardStub.selection.cell = null;
            result = reducer(boardStub, action);

            expect(result).toBe(boardStub);
        });

        it("shouldn't increment the selection cell position if at board limit", () => {
            boardStub.selection.cell = new Vec2(BOARD_SIZE - 1, 5);
            const result = reducer(boardStub, action);

            expect(result.selection.cell).toEqual(boardStub.selection.cell);
        });

        it('should skip a cell if it is already assigned with a letter', () => {
            boardStub.board[7][6] = 'A';
            const result = reducer(boardStub, action);

            const expectedNewPosition = initialSelectionPosition;
            expectedNewPosition.x += 2;
            expect(result.selection.cell).toEqual(expectedNewPosition);
        });

        it('should remove the orientation if the next cell is at the board limit', () => {
            boardStub.selection.cell = new Vec2(BOARD_SIZE - 2, 0);
            const result = reducer(boardStub, action);

            expect(result.selection.orientation).toBeNull();
        });

        it('should add blank position to the blank list', () => {
            const result = reducer(boardStub, placeLetter({ letter: 'A', isBlank: true }));

            expect(result.blanks.length).toEqual(1);
            expect(result.blanks[0]).toEqual(new Vec2(6, 6));
        });
    });

    describe('[Board] Letters Removed', () => {
        it('should set the given position cells to null in the board', () => {
            const action = removeLetters({
                positions: [new Vec2(5, 5), new Vec2(5, 6)],
            });
            const result = reducer(boardStub, action);

            expect(result.board[action.positions[0].x][action.positions[0].y]).toBeNull();
            expect(result.board[action.positions[1].x][action.positions[1].y]).toBeNull();
        });

        it("shouldn't do anything if positions is empty", () => {
            const action = removeLetters({
                positions: [],
            });
            const result = reducer(boardStub, action);

            expect(result).toBe(boardStub);
        });
    });

    describe('[Board] Selection Cleared', () => {
        it('should reset the board selection', () => {
            const result = reducer(boardStub, clearSelection());
            expect(result.selection).toEqual(new BoardSelection());
        });
    });

    describe('[Board] Selection Backspace', () => {
        const action = backspaceSelection();
        let initialSelectionPosition: Vec2;
        let initialModifiedCell: Vec2;

        beforeEach(() => {
            initialSelectionPosition = new Vec2(6, 5);
            initialModifiedCell = new Vec2(5, 5);
            boardStub.selection = new BoardSelection(initialSelectionPosition, Direction.HORIZONTAL, [initialModifiedCell]);
        });

        it('should set the selection position to the last modified cell and remove the cell from the list', () => {
            const result = reducer(boardStub, action);

            expect(result.selection.cell).toEqual(initialModifiedCell);
            expect(result.selection.modifiedCells.length).toEqual(0);
        });

        it('should set the board cell of the last modified cell to null', () => {
            const result = reducer(boardStub, action);

            expect(result.board[5][5]).toBeNull();
        });

        it('should set the orientation in relation to the last modified cell', () => {
            boardStub.selection.orientation = null;
            let result = reducer(boardStub, action);

            expect(result.selection.orientation).toEqual(Direction.HORIZONTAL);

            boardStub.selection.cell = new Vec2(5, 5);
            boardStub.selection.modifiedCells = [new Vec2(5, 6)];
            result = reducer(boardStub, action);

            expect(result.selection.orientation).toEqual(Direction.VERTICAL);

            boardStub.selection.cell = new Vec2(5, 5);
            boardStub.selection.modifiedCells = [new Vec2(5, 5)];
            result = reducer(boardStub, action);

            expect(result.selection.orientation).toBeNull();
        });

        it('should clear the selection if the no cells were modified', () => {
            boardStub.selection.modifiedCells = [];
            const result = reducer(boardStub, action);

            expect(result.selection).toEqual(new BoardSelection());
        });

        it("shouldn't do anything if no cell are selected", () => {
            boardStub.selection.cell = null;
            const result = reducer(boardStub, action);

            expect(result).toBe(boardStub);
        });

        it('should remove the blank if the last modified cell was a blank', () => {
            boardStub.blanks = [initialModifiedCell];
            const result = reducer(boardStub, action);

            expect(result.blanks.length).toEqual(0);
        });
    });
});
