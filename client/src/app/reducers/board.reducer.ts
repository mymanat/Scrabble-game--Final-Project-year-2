import { backspaceSelection, cellClick, clearSelection, placeLetter, removeLetters, syncBoardSuccess } from '@app/actions/board.actions';
import { gameStatusReceived, resetAllState } from '@app/actions/game-status.actions';
import { placeWordSuccess } from '@app/actions/player.actions';
import { BoardSelection } from '@app/classes/board-selection';
import { Direction } from '@app/enums/direction';
import { createReducer, on } from '@ngrx/store';
import { Letter, stringToLetter } from 'common/classes/letter';
import { Multiplier } from 'common/classes/multiplier';
import { iVec2, Vec2 } from 'common/classes/vec2';
import { BOARD_SIZE } from 'common/constants';

export const boardFeatureKey = 'board';

export const createEmptyMatrix = (dimensions: iVec2) => {
    const matrix = new Array(dimensions.x);
    for (let i = 0; i < dimensions.x; i++) {
        matrix[i] = new Array(dimensions.y);
        for (let j = 0; j < dimensions.y; j++) matrix[i][j] = null;
    }
    return matrix;
};

const cloneBoard = (board: (Letter | null)[][]): (Letter | null)[][] => {
    const newBoard = createEmptyMatrix({ x: board.length, y: board[0].length });
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            newBoard[i][j] = board[i][j];
        }
    }
    return newBoard;
};

export const isCellAtBoardLimit = (board: (Letter | null)[][], pos: Vec2, orientation: Direction | null): boolean => {
    switch (orientation) {
        case Direction.HORIZONTAL:
            for (let i = pos.x + 1; i < BOARD_SIZE; ++i) if (board[i][pos.y] === null) return false;
            break;
        case Direction.VERTICAL:
            for (let i = pos.y + 1; i < BOARD_SIZE; ++i) if (board[pos.x][i] === null) return false;
            break;
    }
    return true;
};

export const switchOrientation = (oldOrientation: Direction | null): Direction => {
    return oldOrientation === Direction.HORIZONTAL ? Direction.VERTICAL : Direction.HORIZONTAL;
};

export interface BoardState {
    board: (Letter | null)[][];
    pointsPerLetter: Map<Letter, number>;
    multipliers: (Multiplier | null)[][];
    blanks: iVec2[];
    lastPlacedWord: iVec2[];
    selection: BoardSelection;
}

export const initialState: BoardState = {
    board: [],
    pointsPerLetter: new Map(),
    multipliers: [],
    blanks: [],
    lastPlacedWord: [],
    selection: new BoardSelection(null, 'horizontal' as Direction),
};
export const reducer = createReducer(
    initialState,
    on(syncBoardSuccess, (state, { newBoard }) => ({ ...state, board: newBoard })),

    on(gameStatusReceived, (state, { board }) => ({
        ...state,
        board: board.board,
        multipliers: board.multipliers,
        blanks: board.blanks,
        lastPlacedWord: board.lastPlacedWord,
        // transformer le array de tuple en map
        pointsPerLetter: new Map(board.pointsPerLetter as unknown as [Letter, number][]),
        // Clear la selection au cas de fin de tour
        selection: new BoardSelection(),
    })),

    on(placeWordSuccess, (state, { word }) => {
        const multipliersCopy = JSON.parse(JSON.stringify(state.multipliers));
        const boardCopy = cloneBoard(state.board);
        const blankCopy: Vec2[] = JSON.parse(JSON.stringify(state.blanks));
        for (let i = 0; i < word.length(); ++i) {
            switch (word.direction) {
                case Direction.HORIZONTAL:
                    boardCopy[word.position.x + i][word.position.y] = word.letters[i].toUpperCase() as Letter;
                    multipliersCopy[word.position.x + i][word.position.y] = null;
                    if (stringToLetter(word.letters[i]) === '*') {
                        blankCopy.push(new Vec2(word.position.x + i, word.position.y));
                    }
                    break;
                case Direction.VERTICAL:
                    boardCopy[word.position.x][word.position.y + i] = word.letters[i].toUpperCase() as Letter;
                    multipliersCopy[word.position.x][word.position.y + i] = null;
                    if (stringToLetter(word.letters[i]) === '*') {
                        blankCopy.push(new Vec2(word.position.x, word.position.y + i));
                    }
                    break;
            }
        }
        return { ...state, board: boardCopy, blanks: blankCopy, multipliers: multipliersCopy };
    }),

    on(cellClick, (state, { pos }) => {
        // Si des lettres ont déjà été placées
        if (state.selection.modifiedCells.length > 0) return state;

        const tempState = {
            ...state,
            selection: state.selection.copy(),
            lastPlacedWord: [],
        };

        tempState.selection.cell = new Vec2(pos.x, pos.y);

        let orientation: Direction | null = state.selection.cell?.equals(tempState.selection.cell)
            ? switchOrientation(tempState.selection.orientation)
            : Direction.HORIZONTAL;

        if (isCellAtBoardLimit(state.board, tempState.selection.cell, orientation)) {
            orientation = switchOrientation(orientation);
            if (isCellAtBoardLimit(state.board, tempState.selection.cell, orientation)) orientation = null;
        }

        tempState.selection.orientation = orientation;
        return tempState;
    }),

    on(placeLetter, (state, { letter, isBlank }) => {
        const selection = state.selection.copy();
        if (!selection.cell) return state;

        if (state.board[selection.cell.x][selection.cell.y]) return state;
        const board = cloneBoard(state.board);
        board[selection.cell.x][selection.cell.y] = letter;

        const blanks = [...state.blanks];
        if (isBlank) blanks.push(selection.cell.copy());
        const lastPlacedWord = [...state.lastPlacedWord];
        lastPlacedWord.push(selection.cell.copy());

        selection.modifiedCells.push(selection.cell.copy());

        if (!isCellAtBoardLimit(state.board, selection.cell, selection.orientation))
            do {
                switch (state.selection.orientation) {
                    case Direction.HORIZONTAL:
                        selection.cell.x++;
                        break;
                    case Direction.VERTICAL:
                        selection.cell.y++;
                        break;
                }
            } while (board[selection.cell.x][selection.cell.y] !== null);

        if (isCellAtBoardLimit(state.board, selection.cell, selection.orientation)) selection.orientation = null;

        return { ...state, selection, board, blanks, lastPlacedWord };
    }),

    on(removeLetters, (state, { positions }) => {
        if (positions.length === 0) return state;
        const board = cloneBoard(state.board);
        const blanks = [...state.blanks];
        [...positions].reverse().forEach((pos) => {
            board[pos.x][pos.y] = null;
            while (blanks.find((position) => pos.equals(position))) blanks.pop();
        });

        return { ...state, board, blanks };
    }),

    on(clearSelection, (state): BoardState => {
        return { ...state, selection: new BoardSelection() };
    }),

    on(backspaceSelection, (state): BoardState => {
        const selection = state.selection.copy();

        if (selection.cell === null) return state;
        if (selection.modifiedCells.length === 0)
            // Clear selection
            return { ...state, selection: new BoardSelection() };

        const lastCell = selection.modifiedCells.pop() as Vec2;

        selection.orientation = selection.cell.x === lastCell.x ? Direction.VERTICAL : Direction.HORIZONTAL;
        if (selection.cell.equals(lastCell)) selection.orientation = null;

        selection.cell = lastCell;

        const board = cloneBoard(state.board);
        board[selection.cell.x][selection.cell.y] = null;

        const blanks = [...state.blanks];
        if (blanks.length > 0 && lastCell.equals(blanks[blanks.length - 1] as Vec2)) blanks.pop();

        return { ...state, board, selection, blanks };
    }),

    on(resetAllState, () => initialState),
);
