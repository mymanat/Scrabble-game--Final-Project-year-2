/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript
import { Injectable } from '@angular/core';
import { loadLeaderboard, resetLeaderboard } from '@app/actions/leaderboard.actions';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

@Injectable()
export class LeaderboardEffects {
    loadLeaderboard$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(loadLeaderboard),
                tap(() => {
                    this.leaderboardService.getLeaderboard();
                }),
            ),
        { dispatch: false },
    );

    resetLeaderboard$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(resetLeaderboard),
                tap(() => {
                    this.leaderboardService.resetLeaderboard();
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private leaderboardService: LeaderboardService) {}
}
