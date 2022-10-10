import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { changeGameMode } from '@app/actions/game-status.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { GameMode } from 'common/interfaces/game-mode';
import { cold } from 'jasmine-marbles';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let store: MockStore;
    const mockDialogSpy: { open: jasmine.Spy } = {
        open: jasmine.createSpy('open'),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            imports: [AppMaterialModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockDialogSpy,
                },
                provideMockStore(),
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch changeGameMode with classical when classicModeChosen called', () => {
        const expectedAction = cold('a', { a: changeGameMode({ gameMode: GameMode.Classical }) });
        component.classicModeChosen();
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch changeGameMode with log2990 when log2990ModeChosen called', () => {
        const expectedAction = cold('a', { a: changeGameMode({ gameMode: GameMode.Log2990 }) });
        component.log2990ModeChosen();
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should open leaderboard dialog', () => {
        component.openLeaderboard();
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });
});
