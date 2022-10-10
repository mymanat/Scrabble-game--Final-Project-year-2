import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { addDictionary, modifyDictionary } from '@app/actions/dictionaries.actions';
import { Store } from '@ngrx/store';
import { iDictionary } from 'common/interfaces/dictionary';

@Component({
    selector: 'app-dictionary-form-dialog',
    templateUrl: './dictionary-form-dialog.component.html',
    styleUrls: ['./dictionary-form-dialog.component.scss'],
})
export class DictionaryFormDialogComponent implements OnInit {
    settingsForm: FormGroup;
    dictionaryIndex: number | null;
    currentDictionary: iDictionary | null;
    fileRequired: boolean;

    loadedDictionary: iDictionary | undefined;
    loadedFile: File;

    constructor(
        private fb: FormBuilder,
        private store: Store<{ dictionaries: iDictionary[] }>,
        private dialogRef: MatDialogRef<DictionaryFormDialogComponent>,
        private snackBar: MatSnackBar,
    ) {
        this.dictionaryIndex = null;
        this.currentDictionary = null;
        this.fileRequired = false;
    }

    ngOnInit(): void {
        this.settingsForm = this.fb.group({
            title: new FormControl({ value: this.currentDictionary?.title, disabled: this.fileRequired }, [Validators.required]),
            description: new FormControl({ value: this.currentDictionary?.description, disabled: this.fileRequired }, [Validators.required]),
            file: ['', this.fileRequired ? Validators.required : Validators.nullValidator],
        });
    }

    onFileSelected(event: Event) {
        this.loadedFile = (event as unknown as { target: { files: File[] } }).target.files[0];
        const fileExtension = this.loadedFile.name.split('.').pop();
        if (fileExtension !== 'json') {
            this.dispatchFileError('Mauvaise extention de fichier');
            return;
        }
        this.loadedFile.text().then((text) => {
            const jsonFile = JSON.parse(text);
            if (jsonFile.title === undefined || jsonFile.description === undefined || jsonFile.words === undefined) {
                this.dispatchFileError('Mauvais attributs dans le fichier json');
                return;
            }
            this.loadedDictionary = jsonFile;
            this.settingsForm.controls.title.setValue(jsonFile.title);
            this.settingsForm.controls.description.setValue(jsonFile.description);
            this.settingsForm.controls.title.disable();
            this.settingsForm.controls.description.disable();
        });
    }

    onSubmit() {
        if (this.dictionaryTitleExists()) {
            this.dispatchFileError('Titre de dictionnaire déjà existant');
            return;
        }
        if (this.dictionaryIndex !== null && this.currentDictionary != null) {
            this.store.dispatch(
                modifyDictionary({
                    oldDictionary: this.currentDictionary,
                    newDictionary: this.getFormDictionary(),
                }),
            );
        } else if (this.loadedDictionary) {
            const formDictionary = this.getFormDictionary();
            this.loadedDictionary.title = formDictionary.title;
            this.loadedDictionary.description = formDictionary.description;
            this.store.dispatch(addDictionary({ file: this.loadedFile, dictionary: this.loadedDictionary }));
        }

        this.dialogRef.close();
    }

    private getFormDictionary(): iDictionary {
        return { title: this.settingsForm.controls.title.value, description: this.settingsForm.controls.description.value };
    }

    private dictionaryTitleExists(): boolean {
        let titleExists: iDictionary | undefined;
        const dictionaryTitleSelected = this.settingsForm.controls.title.value.toLowerCase();
        this.store.select('dictionaries').subscribe((dictionaries) => {
            titleExists = dictionaries.find((dictionary, index) => {
                const sameTitle = dictionary.title.toLowerCase() === dictionaryTitleSelected;
                const sameIndex = index === this.dictionaryIndex;
                return sameTitle && !sameIndex;
            });
        });
        return titleExists !== undefined;
    }

    private dispatchFileError(message: string): void {
        this.settingsForm.controls.file.setValue('');
        this.settingsForm.controls.title.setValue('');
        this.settingsForm.controls.description.setValue('');
        const durationMilliseconds = 3000;
        const configuration: MatSnackBarConfig = { duration: durationMilliseconds };
        this.snackBar.open(message, 'Compris', configuration);
    }
}
