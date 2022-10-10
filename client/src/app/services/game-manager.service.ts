import { Injectable } from '@angular/core';
import { endGame, gameStatusReceived } from '@app/actions/game-status.actions';
import { BoardState } from '@app/reducers/board.reducer';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Players } from '@app/reducers/player.reducer';
import { Store } from '@ngrx/store';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class GameManagerService {
    constructor(private socketService: SocketClientService, private store: Store) {}

    getGameStatus(): void {
        this.socketService.send('get game status');
        this.socketService.on('game status', (gameStatus: { status: GameStatus; players: Players; board: BoardState }) => {
            this.store.dispatch(gameStatusReceived(gameStatus));
        });
        this.socketService.on('end game', (status: { players: Players; remainingLetters: number; winner: string }) => {
            this.store.dispatch(endGame(status));
        });
    }
}
