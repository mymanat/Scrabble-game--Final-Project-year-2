import { Injectable } from '@angular/core';
import { loadGameHistorySuccess } from '@app/actions/game-history.actions';
import { Store } from '@ngrx/store';
import { GameHistory } from 'common/interfaces/game-history';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class GameHistoryService {
    constructor(private socketService: SocketClientService, private store: Store) {}

    getGameHistory(): void {
        this.socketService.on('receive gameHistory', (gameHistory: GameHistory[]) => {
            this.store.dispatch(loadGameHistorySuccess({ gameHistory }));
        });
        this.socketService.send('get gameHistory');
    }

    resetGameHistory(): void {
        this.socketService.send('reset gameHistory');
    }
}
