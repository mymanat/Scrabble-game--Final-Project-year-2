import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { loadLeaderboard } from '@app/actions/leaderboard.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { LeaderBoardScores } from '@app/reducers/leaderboard.reducer';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { LeaderboardDialogComponent } from './leaderboard-dialog.component';

describe('LeaderboardDialogComponent', () => {
    let component: LeaderboardDialogComponent;
    let fixture: ComponentFixture<LeaderboardDialogComponent>;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LeaderboardDialogComponent],
            imports: [AppMaterialModule, BrowserAnimationsModule],
            providers: [provideMockStore()],
        }).compileComponents();
        store = TestBed.inject(MockStore);
        store.overrideSelector('highScores', {} as unknown as LeaderBoardScores);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LeaderboardDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch loadLeaderboard when created', () => {
        const expectedAction = cold('a', { a: loadLeaderboard() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });
});
