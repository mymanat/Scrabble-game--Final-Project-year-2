import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { loadLeaderboard } from '@app/actions/leaderboard.actions';
import { HighScore } from '@app/classes/highscore';
import { LeaderBoardScores } from '@app/reducers/leaderboard.reducer';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-leaderboard-dialog',
    templateUrl: './leaderboard-dialog.component.html',
    styleUrls: ['./leaderboard-dialog.component.scss'],
})
export class LeaderboardDialogComponent {
    dataClassicLeaderBoard: MatTableDataSource<HighScore>;
    dataLog2990LeaderBoard: MatTableDataSource<HighScore>;
    displayedColumns: string[] = ['rank', 'name', 'score'];

    constructor(store: Store<{ highScores: LeaderBoardScores }>) {
        this.dataClassicLeaderBoard = new MatTableDataSource();
        this.dataLog2990LeaderBoard = new MatTableDataSource();
        store.select('highScores').subscribe((highScores) => {
            this.dataClassicLeaderBoard.data = highScores.classicHighScores;
            this.dataLog2990LeaderBoard.data = highScores.log2990HighScores;
        });
        store.dispatch(loadLeaderboard());
    }
}
