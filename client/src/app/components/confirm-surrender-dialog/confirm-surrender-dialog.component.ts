import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { resetSocketConnection, surrender } from '@app/actions/player.actions';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-confirm-surrender-dialog',
    templateUrl: './confirm-surrender-dialog.component.html',
    styleUrls: ['./confirm-surrender-dialog.component.scss'],
})
export class ConfirmSurrenderDialogComponent {
    constructor(public dialogRef: MatDialogRef<ConfirmSurrenderDialogComponent>, private store: Store) {}

    closeDialog(): void {
        this.dialogRef.close();
    }

    surrenderGame(): void {
        this.store.dispatch(surrender());
        this.closeDialog();
        this.store.dispatch(resetSocketConnection());
    }
}
