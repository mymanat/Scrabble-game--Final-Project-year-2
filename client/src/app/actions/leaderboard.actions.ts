import { HighScore } from '@app/classes/highscore';
import { createAction, props } from '@ngrx/store';

export const loadLeaderboard = createAction('[HighScores] Load LeaderBoard');

export const loadClassicLeaderboardSuccess = createAction('[HighScores] Load Classic HighScores Success', props<{ highScores: HighScore[] }>());

export const loadLog2990LeaderboardSuccess = createAction('[HighScores] Load Log2990 HighScores Success', props<{ highScores: HighScore[] }>());

export const resetLeaderboard = createAction('[HighScores] Reset HighScores');
