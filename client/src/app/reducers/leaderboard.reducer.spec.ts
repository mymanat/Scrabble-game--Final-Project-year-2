import { loadClassicLeaderboardSuccess, loadLog2990LeaderboardSuccess } from '@app/actions/leaderboard.actions';
import { HighScore } from '@app/classes/highscore';
import { initialState, reducer } from './leaderboard.reducer';

describe('LeaderBoard Reducer', () => {
    it('should return the new state when classic HighScores are changed', () => {
        const highScores = [{ name: 'name5', score: 4 }] as HighScore[];
        const action = loadClassicLeaderboardSuccess({ highScores });

        const result = reducer(initialState, action);

        expect(result).toEqual({ classicHighScores: highScores, log2990HighScores: initialState.log2990HighScores });
    });

    it('should return the new state when log2990 HighScores are changed', () => {
        const highScores = [{ name: 'name5', score: 4 }] as HighScore[];
        const action = loadLog2990LeaderboardSuccess({ highScores });

        const result = reducer(initialState, action);

        expect(result).toEqual({ classicHighScores: initialState.classicHighScores, log2990HighScores: highScores });
    });
});
