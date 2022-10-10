/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript

import { Injectable } from '@angular/core';
import { receivedMessage } from '@app/actions/chat.actions';
import { endGame, getGameStatus } from '@app/actions/game-status.actions';
import { GameManagerService } from '@app/services/game-manager.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';

@Injectable()
export class GameEffects {
    getGameStatus$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(getGameStatus),
                tap(() => {
                    this.gameManager.getGameStatus();
                }),
            ),
        { dispatch: false },
    );

    endGameEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(endGame),
                tap((action) => {
                    this.store.dispatch(
                        receivedMessage({
                            username: '',
                            message: `Fin de partie - ${action.remainingLetters}`,
                            messageType: 'System',
                        }),
                    );
                    this.store.dispatch(
                        receivedMessage({
                            username: '',
                            message: `
                            ${action.players.player.name}: ${action.players.player.easel}`,
                            messageType: 'System',
                        }),
                    );
                    this.store.dispatch(
                        receivedMessage({
                            username: '',
                            message: `${action.players.opponent.name}: ${action.players.opponent.easel}`,
                            messageType: 'System',
                        }),
                    );
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private gameManager: GameManagerService, private store: Store) {}
}
