/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript

import { HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    addDictionary,
    addDictionaryFailed,
    addDictionarySuccess,
    deleteDictionary,
    downloadDictionary,
    loadDictionaries,
    modifyDictionary,
    resetDictionaries,
} from '@app/actions/dictionaries.actions';
import { DictionaryService } from '@app/services/dictionary.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { iDictionary } from 'common/interfaces/dictionary';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class DictionariesEffects {
    loadDictionaries$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(loadDictionaries),
                tap(() => {
                    this.dictionaryService.getDictionaries();
                }),
            ),
        { dispatch: false },
    );

    addDictionaries$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(addDictionary),
                tap(({ file, dictionary }) => {
                    this.dictionaryService
                        .addDictionary(file)
                        .pipe(catchError(async (error) => this.handleAddDictionaryResponse(error, file, dictionary)))
                        .subscribe();
                }),
            ),
        { dispatch: false },
    );

    resetDictionaries$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(resetDictionaries),
                tap(() => {
                    this.dictionaryService.resetDictionaries();
                }),
            ),
        { dispatch: false },
    );

    modifyDictionary$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(modifyDictionary),
                tap(({ oldDictionary, newDictionary }) => {
                    this.dictionaryService.modifyDictionary(oldDictionary, newDictionary);
                }),
            ),
        { dispatch: false },
    );

    deleteDictionary$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(deleteDictionary),
                tap(({ dictionary }) => {
                    this.dictionaryService.deleteDictionary(dictionary.title);
                }),
            ),
        { dispatch: false },
    );

    downloadDictionaries$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(downloadDictionary),
                tap(({ dictionary }) => {
                    this.dictionaryService.downloadDictionary(dictionary);
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private dictionaryService: DictionaryService, private store: Store) {}

    handleAddDictionaryResponse = async (response: Response, file: File, dictionary: iDictionary) => {
        if (response.status === HttpStatusCode.Ok) {
            await file.text().then((content) => {
                const fileDictionary: iDictionary = JSON.parse(content);
                this.store.dispatch(addDictionarySuccess({ dictionary: fileDictionary }));
                this.dictionaryService.modifyDictionary(fileDictionary, dictionary);
            });
        } else this.store.dispatch(addDictionaryFailed({ error: Error(`${response.status} - ${response.statusText || ''}`) }));
    };
}
