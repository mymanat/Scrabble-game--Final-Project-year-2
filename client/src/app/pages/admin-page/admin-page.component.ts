import { Component } from '@angular/core';
import { resetLeaderboard } from '@app/actions/leaderboard.actions';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent {
    constructor(private store: Store) {}

    resetLeaderBoard(): void {
        this.store.dispatch(resetLeaderboard());
    }
}
