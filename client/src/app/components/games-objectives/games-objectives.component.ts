import { Component } from '@angular/core';
import { GameObjectives } from '@app/reducers/game-objective.reducer';
import { Store } from '@ngrx/store';
import { Log2990Objective } from 'common/interfaces/log2990-objectives';

@Component({
    selector: 'app-games-objectives',
    templateUrl: './games-objectives.component.html',
    styleUrls: ['./games-objectives.component.scss'],
})
export class GamesObjectivesComponent {
    publicObjectives: Log2990Objective[];
    privateObjectives: Log2990Objective[];
    isChecked: boolean = true;

    constructor(store: Store<{ gameObjective: GameObjectives }>) {
        store.select('gameObjective').subscribe((objectives) => {
            this.publicObjectives = objectives.publicObjectives;
            this.privateObjectives = objectives.privateObjectives;
        });
    }

    notClickable(event: MouseEvent) {
        event.preventDefault();
    }
}
