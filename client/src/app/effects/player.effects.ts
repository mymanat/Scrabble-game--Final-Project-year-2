/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript

import { Injectable } from '@angular/core';
import { exchangeLetters, placeWord, resetSocketConnection, surrender } from '@app/actions/player.actions';
import { PlayerService } from '@app/services/player.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

@Injectable()
export class PlayerEffects {
    surrenderEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(surrender),
                tap(() => {
                    this.playerService.surrenderGame();
                }),
            ),
        { dispatch: false },
    );

    resetSocketConnection$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(resetSocketConnection),
                tap(() => {
                    this.socketService.resetConnection();
                }),
            ),
        { dispatch: false },
    );

    placeWordEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(placeWord),
                tap((action) => {
                    this.playerService.placeWord(action.position, action.letters);
                }),
            ),
        { dispatch: false },
    );

    exchangeLettersEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(exchangeLetters),
                tap((action) => {
                    this.playerService.exchangeLetters(action.letters);
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private playerService: PlayerService, private socketService: SocketClientService) {}
}
