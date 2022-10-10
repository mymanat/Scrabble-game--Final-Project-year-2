import { TestBed } from '@angular/core/testing';
import { browserUnload } from '@app/actions/browser.actions';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppComponent } from '@app/pages/app/app.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';

describe('AppComponent', () => {
    let app: AppComponent;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppRoutingModule],
            declarations: [AppComponent],
            providers: [provideMockStore()],
        }).compileComponents();
        const fixture = TestBed.createComponent(AppComponent);
        app = fixture.componentInstance;
        store = TestBed.inject(MockStore);
    });

    it('should create the app', () => {
        expect(app).toBeTruthy();
    });

    it('should dispatch browserUnload when window unload', () => {
        app.catchBrowserReload(new Event('beforeunload'));

        const expectedAction = cold('a', { a: browserUnload() });

        expect(store.scannedActions$).toBeObservable(expectedAction);
    });
});
