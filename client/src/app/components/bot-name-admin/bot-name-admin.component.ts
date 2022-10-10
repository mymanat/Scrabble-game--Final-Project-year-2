import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { deleteBotName, loadBotNames, resetBotNames } from '@app/actions/bot-names.actions';
import { BotNameFormDialogComponent } from '@app/components/bot-name-form-dialog/bot-name-form-dialog.component';
import { BotNames } from '@app/interfaces/bot-names';
import { Store } from '@ngrx/store';
import { EASY_BOT_NAMES, HARD_BOT_NAMES } from 'common/constants';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-bot-name-admin',
    templateUrl: './bot-name-admin.component.html',
    styleUrls: ['./bot-name-admin.component.scss'],
})
export class BotAdminComponent {
    botNames$: Observable<BotNames>;

    constructor(private store: Store<{ botNames: BotNames }>, public dialog: MatDialog) {
        this.botNames$ = store.select('botNames');
        store.dispatch(loadBotNames());
    }

    reset() {
        this.store.dispatch(resetBotNames());
    }

    add() {
        this.dialog.open(BotNameFormDialogComponent);
    }

    edit(_name: string, _difficulty: string) {
        const dialogRef = this.dialog.open(BotNameFormDialogComponent);
        const dialogComponent = dialogRef.componentInstance;
        dialogComponent.oldName = _name;
        dialogComponent.currentBotName = _name;
        dialogComponent.currentDifficulty = _difficulty;
    }

    delete(name: string, difficulty: string) {
        this.store.dispatch(deleteBotName({ name, difficulty }));
    }

    botNameNotChangeable(name: string): boolean {
        let isNotChangeable = EASY_BOT_NAMES.includes(name);
        isNotChangeable ||= HARD_BOT_NAMES.includes(name);
        return isNotChangeable;
    }
}
