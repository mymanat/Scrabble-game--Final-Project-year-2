/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript
import { Injectable } from '@angular/core';
import { loadGameHistory, resetGameHistory } from '@app/actions/game-history.actions';
import { GameHistoryService } from '@app/services/game-history.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

@Injectable()
export class GameHistoryEffects {
    loadGameHistory$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(loadGameHistory),
                tap(() => {
                    this.gameHistoryService.getGameHistory();
                }),
            ),
        { dispatch: false },
    );

    resetGameHistory$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(resetGameHistory),
                tap(() => {
                    this.gameHistoryService.resetGameHistory();
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private gameHistoryService: GameHistoryService) {}
}
