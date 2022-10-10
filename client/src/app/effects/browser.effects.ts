/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript

import { Injectable } from '@angular/core';
import { browserReload, browserUnload } from '@app/actions/browser.actions';
import { BrowserManagerService } from '@app/services/browser-manager.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

@Injectable()
export class BrowserEffects {
    reloadEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(browserReload),
                tap(() => {
                    this.browserManager.onBrowserLoad();
                }),
            ),
        { dispatch: false },
    );

    unloadEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(browserUnload),
                tap(() => {
                    this.browserManager.onBrowserClosed();
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private browserManager: BrowserManagerService) {}
}
