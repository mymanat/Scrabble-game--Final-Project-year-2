import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { cellClick } from '@app/actions/board.actions';
import { BoardSelection } from '@app/classes/board-selection';
import { BoardState } from '@app/reducers/board.reducer';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Players } from '@app/reducers/player.reducer';
import { Store } from '@ngrx/store';
import { Letter } from 'common/classes/letter';
import { iVec2 } from 'common/classes/vec2';
import { Observable, Subscription } from 'rxjs';

@Component({
    /* Nécessaire pour les composantes SVG */
    /* eslint-disable-next-line @angular-eslint/component-selector */
    selector: '[app-cell-empty]',
    templateUrl: './cell-empty.component.html',
    styleUrls: ['./cell-empty.component.scss'],
})
export class CellEmptyComponent implements OnInit, OnDestroy {
    @Input() pos: iVec2;

    selection$: Observable<BoardSelection>;

    private playersSubscription: Subscription;
    private gameStatusSubscription: Subscription;
    private boardSubscription: Subscription;

    private currentPlayer: string;
    private activePlayer: string;
    private gameEnded: boolean;
    private letter: Letter | null = null;

    constructor(
        public store: Store<{
            board: BoardState;
            players: Players;
            gameStatus: GameStatus;
        }>,
    ) {
        this.selection$ = store.select('board', 'selection');
        this.pos = { x: 0, y: 0 };
    }

    ngOnInit(): void {
        this.playersSubscription = this.store.select('players').subscribe((state) => {
            this.currentPlayer = state.player.name;
        });
        this.gameStatusSubscription = this.store.select('gameStatus').subscribe((state) => {
            this.activePlayer = state.activePlayer;
            this.gameEnded = state.gameEnded;
        });
        this.boardSubscription = this.store.select('board').subscribe((state) => {
            this.letter = state.board[this.pos.x][this.pos.y];
        });
    }

    ngOnDestroy(): void {
        this.playersSubscription.unsubscribe();
        this.gameStatusSubscription.unsubscribe();
        this.boardSubscription.unsubscribe();
    }

    click(): void {
        // Premier contrôle de validation pour la sélection d'une cellule (Active player + Game Ended)
        if (this.gameEnded || this.currentPlayer !== this.activePlayer) return;

        // Deuxième validation pour la sélection d'une cellule (Is cell empty)
        if (this.letter) return;

        this.store.dispatch(cellClick({ pos: this.pos }));
    }
}
