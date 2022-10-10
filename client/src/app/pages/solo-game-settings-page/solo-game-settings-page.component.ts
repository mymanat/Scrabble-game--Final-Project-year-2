import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createSoloRoom } from '@app/actions/room.actions';
import { Store } from '@ngrx/store';
import { GameOptions } from 'common/classes/game-options';

@Component({
    templateUrl: './solo-game-settings-page.component.html',
    styleUrls: ['./solo-game-settings-page.component.scss'],
})
export class SoloGameSettingsPageComponent {
    constructor(private store: Store, private router: Router, private dialogRef: MatDialogRef<SoloGameSettingsPageComponent>) {}

    onGameOptionsSubmit(gameOptions: GameOptions, botLevel?: string) {
        if (botLevel === undefined) return;
        this.store.dispatch(createSoloRoom({ gameOptions, botLevel }));
        this.router.navigate(['game']);
        this.dialogRef.close();
    }
}
