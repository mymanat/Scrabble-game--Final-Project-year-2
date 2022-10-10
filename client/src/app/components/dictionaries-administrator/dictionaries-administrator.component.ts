import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { deleteDictionary, downloadDictionary, loadDictionaries, resetDictionaries } from '@app/actions/dictionaries.actions';
import { DictionaryFormDialogComponent } from '@app/components/dictionary-form-dialog/dictionary-form-dialog.component';
import { Store } from '@ngrx/store';
import { DEFAULT_DICTIONARY } from 'common/constants';
import { iDictionary } from 'common/interfaces/dictionary';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-dictionaries-administrator',
    templateUrl: './dictionaries-administrator.component.html',
    styleUrls: ['./dictionaries-administrator.component.scss'],
})
export class DictionariesAdministratorComponent {
    defaultDictionary: string = DEFAULT_DICTIONARY;
    dictionaries$: Observable<iDictionary[]>;

    constructor(private store: Store<{ dictionaries: iDictionary[] }>, public dialog: MatDialog) {
        this.dictionaries$ = store.select('dictionaries');
        store.dispatch(loadDictionaries());
    }

    addDictionary() {
        const dialogRef = this.dialog.open(DictionaryFormDialogComponent);
        const dialogComponent = dialogRef.componentInstance;
        dialogComponent.fileRequired = true;
    }

    resetDictionaries() {
        this.store.dispatch(resetDictionaries());
    }

    modifyDictionary(index: number, currentDictionary: iDictionary): void {
        const dialogRef = this.dialog.open(DictionaryFormDialogComponent);
        const dialogComponent = dialogRef.componentInstance;
        dialogComponent.dictionaryIndex = index;
        dialogComponent.currentDictionary = currentDictionary;
    }

    deleteDictionary(dictionary: iDictionary) {
        this.store.dispatch(deleteDictionary({ dictionary }));
    }

    downloadDictionary(dictionary: iDictionary) {
        this.store.dispatch(downloadDictionary({ dictionary }));
    }
}
