import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { loadGameHistory, resetGameHistory } from '@app/actions/game-history.actions';
import { GameHistoryInterface } from '@app/reducers/game-history.reducer';
import { Store } from '@ngrx/store';
import { GameHistory } from 'common/interfaces/game-history';

@Component({
    selector: 'app-game-history-table',
    templateUrl: './game-history-table.component.html',
    styleUrls: ['./game-history-table.component.scss'],
})
export class GameHistoryTableComponent {
    dataGameHistory: MatTableDataSource<GameHistory>;
    displayedColumns: string[] = ['date', 'gameDuration', 'Player1', 'Player2', 'gameMode', 'isSurrender'];

    constructor(private store: Store<{ gameHistory: GameHistoryInterface }>) {
        this.dataGameHistory = new MatTableDataSource();
        store.select('gameHistory').subscribe((gameHistory) => {
            this.dataGameHistory.data = gameHistory.gameHistory;
        });
        store.dispatch(loadGameHistory());
    }

    resetGameHistory(): void {
        this.store.dispatch(resetGameHistory());
    }
}
