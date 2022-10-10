import { Component } from '@angular/core';
import { browserUnload } from '@app/actions/browser.actions';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    constructor(private store: Store) {
        window.addEventListener('beforeunload', (event) => this.catchBrowserReload(event));
    }

    catchBrowserReload(event: Event) {
        event.preventDefault();
        this.store.dispatch(browserUnload());
    }
}
