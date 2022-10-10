/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript

import { Injectable } from '@angular/core';
import { addBotName, deleteBotName, loadBotNames, modifyBotName, resetBotNames } from '@app/actions/bot-names.actions';
import { BotNamesService } from '@app/services/bot-names.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

@Injectable()
export class BotNamesEffects {
    loadBotNames$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(loadBotNames),
                tap(() => {
                    this.botNamesService.getBotNames();
                }),
            ),
        { dispatch: false },
    );

    addBotName$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(addBotName),
                tap((action) => {
                    this.botNamesService.addBotName(action.name, action.difficulty);
                }),
            ),
        { dispatch: false },
    );

    deleteBotName$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(deleteBotName),
                tap((action) => {
                    this.botNamesService.deleteBotName(action.name, action.difficulty);
                }),
            ),
        { dispatch: false },
    );

    modifyBotName$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(modifyBotName),
                tap((action) => {
                    this.botNamesService.modifyBotName(action.oldName, action.newName);
                }),
            ),
        { dispatch: false },
    );

    resetBotNames$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(resetBotNames),
                tap(() => {
                    this.botNamesService.resetBotNames();
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private botNamesService: BotNamesService) {}
}
