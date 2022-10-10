import { Component } from '@angular/core';
import { browserReload } from '@app/actions/browser.actions';
import { getGameStatus } from '@app/actions/game-status.actions';
import { GameObjectives } from '@app/reducers/game-objective.reducer';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent {
    isLog2990: boolean;
    constructor(private store: Store<{ gameObjective: GameObjectives }>) {
        store.dispatch(getGameStatus());
        window.addEventListener('load', (event) => this.catchBrowserLoad(event));
        this.store
            .select('gameObjective')
            .subscribe(
                (gameObjectives) =>
                    (this.isLog2990 = !(gameObjectives.publicObjectives.length === 0 && gameObjectives.privateObjectives.length === 0)),
            );
    }

    catchBrowserLoad(event: Event) {
        event.preventDefault();
        this.store.dispatch(browserReload());
    }
}
