import { createAction, props } from '@ngrx/store';
import { GameHistory } from 'common/interfaces/game-history';

export const loadGameHistory = createAction('[GameHistory] Load Game History');

export const loadGameHistorySuccess = createAction('[GameHistory] Load Game History Success', props<{ gameHistory: GameHistory[] }>());

export const resetGameHistory = createAction('[GameHistory] Reset Game History');
