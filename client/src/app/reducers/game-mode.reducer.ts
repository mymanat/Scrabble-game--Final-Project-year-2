import { changeGameMode } from '@app/actions/game-status.actions';
import { createReducer, on } from '@ngrx/store';
import { GameMode } from 'common/interfaces/game-mode';

export const boardFeatureKey = 'gameMode';

export const reducer = createReducer(
    GameMode.Classical,
    on(changeGameMode, (state, { gameMode }) => gameMode),
);
