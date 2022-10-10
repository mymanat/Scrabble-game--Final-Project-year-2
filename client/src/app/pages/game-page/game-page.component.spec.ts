import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { browserReload } from '@app/actions/browser.actions';
import { BoardComponent } from '@app/components/board/board.component';
import { CellLetterX2Component } from '@app/components/cells/cell-letter-x2/cell-letter-x2.component';
import { CellLetterX3Component } from '@app/components/cells/cell-letter-x3/cell-letter-x3.component';
import { CellStarComponent } from '@app/components/cells/cell-star/cell-star.component';
import { CellWordX2Component } from '@app/components/cells/cell-word-x2/cell-word-x2.component';
import { CellWordX3Component } from '@app/components/cells/cell-word-x3/cell-word-x3.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { EaselComponent } from '@app/components/easel/easel.component';
import { GamesObjectivesComponent } from '@app/components/games-objectives/games-objectives.component';
import { LetterComponent } from '@app/components/letter/letter.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { SkipTurnButtonComponent } from '@app/components/skip-turn-button/skip-turn-button.component';
import { SurrenderGameButtonComponent } from '@app/components/surrender-game-button/surrender-game-button.component';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { AppMaterialModule } from '@app/modules/material.module';
import { BoardToListPipe } from '@app/pipes/board-to-list.pipe';
import { SocketClientService } from '@app/services/socket-client.service';
import { EffectsRootModule } from '@ngrx/effects';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let store: MockStore;

    beforeEach(async () => {
        const socketHelper = new SocketTestHelper();
        await TestBed.configureTestingModule({
            declarations: [
                GamePageComponent,
                BoardComponent,
                ChatBoxComponent,
                SkipTurnButtonComponent,
                SidebarComponent,
                SurrenderGameButtonComponent,
                EaselComponent,
                BoardToListPipe,
                GamesObjectivesComponent,
                LetterComponent,
                CellStarComponent,
                CellLetterX2Component,
                CellLetterX3Component,
                CellWordX2Component,
                CellWordX3Component,
            ],
            imports: [BrowserAnimationsModule, AppMaterialModule],
            providers: [
                {
                    provide: Router,
                    useValue: jasmine.createSpyObj('router', ['navigateToUrl']),
                },
                {
                    provide: EffectsRootModule,
                    useValue: {
                        addEffects: jasmine.createSpy('addEffects'),
                    },
                },
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketHelper,
                        send: (value: string) => {
                            socketHelper.emit(value);
                            return;
                        },
                        on: (event: string, callback: () => void) => {
                            socketHelper.on(event, callback);
                            return;
                        },
                    },
                },
                provideMockStore({
                    selectors: [
                        {
                            selector: 'players',
                            value: { player: { name: '' } },
                        },
                        {
                            selector: 'gameStatus',
                            value: { activePlayer: '', gameEnded: false },
                        },
                    ],
                }),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(MockStore);
        store.overrideSelector('gameObjective', { publicObjectives: [], privateObjectives: [] });

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch browserReload when window reload', () => {
        component.catchBrowserLoad(new Event('load'));

        const expectedAction = cold('a', { a: browserReload() });

        expect(store.scannedActions$).toBeObservable(expectedAction);
    });
});
