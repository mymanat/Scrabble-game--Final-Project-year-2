import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameJoinPageComponent } from '@app/pages/game-join-page/game-join-page.component';
import { GamePreparationPageComponent } from '@app/pages/game-preparation-page/game-preparation-page.component';
import { SoloGameSettingsPageComponent } from '@app/pages/solo-game-settings-page/solo-game-settings-page.component';
import { Store } from '@ngrx/store';
import { GameMode } from 'common/interfaces/game-mode';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-game-selection-page',
    templateUrl: './game-selection-page.component.html',
    styleUrls: ['./game-selection-page.component.scss'],
})
export class GameSelectionPageComponent {
    gameMode$: Observable<GameMode>;
    constructor(public dialog: MatDialog, store: Store<{ gameMode: GameMode }>) {
        this.gameMode$ = store.select('gameMode');
    }
    openSoloSettingsPage(): void {
        this.dialog.open(SoloGameSettingsPageComponent);
    }
    openGamePreparationPage(): void {
        this.dialog.open(GamePreparationPageComponent);
    }
    openGameJoinPage(): void {
        this.dialog.open(GameJoinPageComponent);
    }
}
