import * as gameHistoryActions from '@app/actions/game-history.actions';
import { createReducer, on } from '@ngrx/store';
import { GameHistory } from 'common/interfaces/game-history';

export interface GameHistoryInterface {
    gameHistory: GameHistory[];
}

export const gameHistoryFeatureKey = 'gameHistory';

export const initialState: GameHistoryInterface = { gameHistory: [] };

export const reducer = createReducer(
    initialState,
    on(gameHistoryActions.loadGameHistorySuccess, (state, { gameHistory }) => ({ ...state, gameHistory })),
);
