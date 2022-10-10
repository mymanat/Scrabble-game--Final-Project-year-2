import { Component } from '@angular/core';
import { messageWritten } from '@app/actions/chat.actions';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Players } from '@app/reducers/player.reducer';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-skip-turn-button',
    templateUrl: './skip-turn-button.component.html',
    styleUrls: ['./skip-turn-button.component.scss'],
})
export class SkipTurnButtonComponent {
    username: string;
    activePlayer: string;
    gameEnded: boolean;

    constructor(private store: Store<{ players: Players; gameStatus: GameStatus }>) {
        store.select('players').subscribe((state) => {
            this.username = state.player.name;
        });
        store.select('gameStatus').subscribe((state) => {
            this.activePlayer = state.activePlayer;
            this.gameEnded = state.gameEnded;
        });
    }

    skipTurn(): void {
        this.store.dispatch(messageWritten({ username: this.username, message: '!passer' }));
    }

    isPlayerTurn(): boolean {
        return this.username === this.activePlayer && !this.gameEnded;
    }
}
