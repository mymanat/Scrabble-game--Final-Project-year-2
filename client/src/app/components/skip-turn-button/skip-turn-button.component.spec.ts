import { ComponentFixture, TestBed } from '@angular/core/testing';
import { messageWritten } from '@app/actions/chat.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { SkipTurnButtonComponent } from './skip-turn-button.component';

describe('SkipTurnButtonComponent', () => {
    let component: SkipTurnButtonComponent;
    let fixture: ComponentFixture<SkipTurnButtonComponent>;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SkipTurnButtonComponent],
            imports: [AppMaterialModule],
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'gameStatus',
                            value: { activePlayer: 'moi', gameEnded: false },
                        },
                        {
                            selector: 'players',
                            value: { player: { name: 'VanDamne' } },
                        },
                    ],
                }),
            ],
        }).compileComponents();

        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SkipTurnButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch "[Chat] Message written"', () => {
        component.username = 'HelloWorld';
        const expectedAction = cold('a', { a: messageWritten({ username: 'HelloWorld', message: '!passer' }) });
        component.skipTurn();
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should return true when it is player turn', () => {
        component.username = 'HelloWorld';
        component.activePlayer = 'HelloWorld';
        expect(component.isPlayerTurn()).toBeTrue();
    });

    it('should return false when it is not player turn', () => {
        component.username = 'HelloWorld';
        component.activePlayer = 'ByeWorld';
        expect(component.isPlayerTurn()).toBeFalse();
    });
});
