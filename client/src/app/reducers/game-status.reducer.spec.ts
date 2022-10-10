import * as gameStatusActions from '@app/actions/game-status.actions';
import { BoardSelection } from '@app/classes/board-selection';
import { Player } from '@app/classes/player';
import { GameStatus, initialState, reducer } from '@app/reducers/game-status.reducer';
import { BoardState } from './board.reducer';
import { Players } from './player.reducer';

describe('[Game Status] Game Status Received', () => {
    const gameStatusStub: GameStatus = {
        activePlayer: '',
        winner: null,
        gameEnded: false,
        letterPotLength: 0,
        timer: 0,
    };

    const playersStub: Players = {
        player: new Player('Player 1'),
        opponent: new Player('Player 2'),
    };

    const boardState: BoardState = {
        board: [],
        multipliers: [],
        pointsPerLetter: new Map(),
        blanks: [],
        lastPlacedWord: [],
        selection: new BoardSelection(),
    };

    it('should set the game status', () => {
        const action = gameStatusActions.gameStatusReceived({
            status: gameStatusStub,
            players: playersStub,
            board: boardState,
        });

        const result = reducer(initialState, action);

        expect(result).toEqual(gameStatusStub);
    });

    it('should set the winner', () => {
        const action = gameStatusActions.endGame({
            players: playersStub,
            winner: 'Player 1',
            remainingLetters: 0,
        });

        const result = reducer(initialState, action);

        expect(result).toEqual({ ...initialState, gameEnded: true, winner: 'Player 1' });
    });

    it('should reset to initial state', () => {
        const action = gameStatusActions.resetAllState();
        const result = reducer(gameStatusStub, action);

        expect(result).toEqual(initialState);
    });

    it('should refresh the current timer', () => {
        const action = gameStatusActions.refreshTimer({ timer: 0 });
        const result = reducer(initialState, action);

        expect(result).toEqual({ ...initialState, timer: 0 });
    });
});
