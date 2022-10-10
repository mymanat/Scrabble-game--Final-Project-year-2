/* eslint-disable dot-notation */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { cellClick } from '@app/actions/board.actions';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { CellEmptyComponent } from './cell-empty.component';

describe('CellEmptyComponent', () => {
    let component: CellEmptyComponent;
    let fixture: ComponentFixture<CellEmptyComponent>;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CellEmptyComponent],
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'players',
                            value: { player: { name: 'player1' } },
                        },
                        {
                            selector: 'gameStatus',
                            value: { activePlayer: 'player1', gameEnded: false },
                        },
                        {
                            selector: 'board',
                            value: { board: [[null]] },
                        },
                    ],
                }),
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CellEmptyComponent);
        component = fixture.componentInstance;
        component.pos = { x: 0, y: 0 };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch cellClick if all the conditions are right in the store', () => {
        component.click();
        const expectedAction = cold('a', { a: cellClick({ pos: component.pos }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should not dispatch cellClick if the current player is not the active player', () => {
        component['activePlayer'] = 'player2';
        component['gameEnded'] = false;
        const dispatchSpy = spyOn(store, 'dispatch');
        component.click();
        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should not dispatch cellClick if the game ended', () => {
        component['activePlayer'] = 'player1';
        component['gameEnded'] = true;
        const dispatchSpy = spyOn(store, 'dispatch');
        component.click();
        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should not dispatch cellClick if the board already contains a letter at cell position', () => {
        component['letter'] = 'A';
        const dispatchSpy = spyOn(store, 'dispatch');
        component.click();
        expect(dispatchSpy).not.toHaveBeenCalled();
    });
});
