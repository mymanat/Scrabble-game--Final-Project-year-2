import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { addBotName, modifyBotName } from '@app/actions/bot-names.actions';
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '@app/constants';
import { BotNames } from '@app/interfaces/bot-names';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-bot-name-form-dialog',
    templateUrl: './bot-name-form-dialog.component.html',
    styleUrls: ['./bot-name-form-dialog.component.scss'],
})
export class BotNameFormDialogComponent implements OnInit {
    currentBotName: string;
    currentDifficulty: string;
    oldName: string | undefined;
    settingsForm: FormGroup;
    constructor(
        private fb: FormBuilder,
        private store: Store<{ botNames: BotNames }>,
        private dialogRef: MatDialogRef<BotNameFormDialogComponent>,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.settingsForm = this.fb.group({
            name: [this.currentBotName, [Validators.required, Validators.minLength(MIN_NAME_LENGTH), Validators.maxLength(MAX_NAME_LENGTH)]],
            difficulty: [
                { value: this.currentDifficulty, disabled: this.oldName !== undefined },
                this.oldName ? Validators.nullValidator : Validators.required,
            ],
        });
    }

    onSubmit(): void {
        const chosenName = this.settingsForm.controls.name.value;
        if (this.verifyNameValidity(chosenName)) {
            this.dispatchError('Nom déjà présent dans les listes');
            return;
        }
        if (!this.oldName) this.store.dispatch(addBotName({ name: chosenName, difficulty: this.settingsForm.controls.difficulty.value }));
        else
            this.store.dispatch(
                modifyBotName({ oldName: this.oldName, newName: this.settingsForm.controls.name.value, difficulty: this.currentDifficulty }),
            );
        this.dialogRef.close();
    }

    private verifyNameValidity(name: string): boolean {
        let nameIsNotValid = false;
        this.store.select('botNames').subscribe((names) => {
            nameIsNotValid ||= names.easy.includes(name);
            nameIsNotValid ||= names.hard.includes(name);
        });
        return nameIsNotValid;
    }

    private dispatchError(message: string): void {
        this.settingsForm.controls.name.setValue(this.oldName);
        const durationMilliseconds = 3000;
        const configuration: MatSnackBarConfig = { duration: durationMilliseconds };
        this.snackBar.open(message, 'Compris', configuration);
    }
}
