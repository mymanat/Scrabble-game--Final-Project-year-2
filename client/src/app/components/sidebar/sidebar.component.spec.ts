import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { messageWritten } from '@app/actions/chat.actions';
import { zoomIn, zoomOut } from '@app/actions/local-settings.actions';
import { Player } from '@app/classes/player';
import { SkipTurnButtonComponent } from '@app/components/skip-turn-button/skip-turn-button.component';
import { SurrenderGameButtonComponent } from '@app/components/surrender-game-button/surrender-game-button.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { KeyManagerService } from '@app/services/key-manager.service';
import { StoreModule } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { DEFAULT_TIMER } from 'common/constants';
import { cold } from 'jasmine-marbles';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;
    let store: MockStore;
    let eventStub: Event;
    let keyManagerMock: jasmine.SpyObj<KeyManagerService>;

    beforeEach(async () => {
        keyManagerMock = jasmine.createSpyObj('keyManager', ['onEnter']);
        await TestBed.configureTestingModule({
            imports: [AppMaterialModule, BrowserAnimationsModule, ReactiveFormsModule, StoreModule.forRoot({})],
            declarations: [SidebarComponent, SkipTurnButtonComponent, SurrenderGameButtonComponent],
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'gameStatus',
                            value: { activePlayer: 'moi', timer: DEFAULT_TIMER, gameEnded: false },
                        },
                        {
                            selector: 'players',
                            value: { player: { name: 'VanDamne' } },
                        },
                    ],
                }),
                { provide: KeyManagerService, useValue: keyManagerMock },
                {
                    provide: Router,
                    useValue: {},
                },
            ],
        }).compileComponents();
        eventStub = {
            preventDefault: () => {
                return;
            },
        } as unknown as Event;
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch "[LocalSettings] Zoom In"', () => {
        const expectedAction = cold('a', { a: zoomIn() });
        component.zoomIn();
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Chat] Message Written"', () => {
        const expectedAction = cold('a', { a: messageWritten({ username: component.activePlayer, message: '!indice' }) });
        component.getHint();
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[LocalSettings] Zoom Out"', () => {
        const expectedAction = cold('a', { a: zoomOut() });
        component.zoomOut();
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should return false when undefined player', () => {
        component.activePlayer = 'John';
        expect(component.isActivePlayer(undefined)).toBeFalse();
    });

    it('should return true when player is active ', () => {
        component.activePlayer = 'John';
        const player = new Player('John');
        expect(component.isActivePlayer(player)).toBeTrue();
    });

    it('should return false when player is not active ', () => {
        component.activePlayer = 'Smith';
        const player = new Player('John');
        expect(component.isActivePlayer(player)).toBeFalse();
    });

    it('should return time from countdown', () => {
        component.countdown = 83;
        expect(component.timerToString()).toBe('1:23');
    });

    it('should decrement a second from countdown', () => {
        const expected = 6;
        component.countdown = 7;
        component.decrementCountdown()();
        expect(component.countdown).toBe(expected);
    });

    it('should not be negative', () => {
        component.countdown = 0;
        component.decrementCountdown()();
        expect(component.countdown).toBe(0);
    });

    it('storeTimerUnLoad should call localStorage.setItem ', () => {
        const spy = spyOn(window.localStorage, 'setItem');
        component.storeTimerUnLoad(eventStub);
        expect(spy).toHaveBeenCalled();
    });

    it('should call keyManager.onEnter', () => {
        component.placeWord();
        expect(keyManagerMock.onEnter).toHaveBeenCalled();
    });
});
