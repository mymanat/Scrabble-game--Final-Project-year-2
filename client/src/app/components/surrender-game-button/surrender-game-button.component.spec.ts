import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { messageWritten } from '@app/actions/chat.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { SurrenderGameButtonComponent } from './surrender-game-button.component';

describe('SurrenderGameComponent', () => {
    let component: SurrenderGameButtonComponent;
    let fixture: ComponentFixture<SurrenderGameButtonComponent>;
    let mockDialogSpy: jasmine.SpyObj<MatDialog>;
    let routerMock: jasmine.SpyObj<Router>;
    let store: MockStore;

    beforeEach(async () => {
        mockDialogSpy = jasmine.createSpyObj('dialog', ['open']);
        routerMock = jasmine.createSpyObj('router', ['navigateByUrl']);
        await TestBed.configureTestingModule({
            declarations: [SurrenderGameButtonComponent],
            imports: [AppMaterialModule],
            providers: [
                {
                    provide: Router,
                    useValue: routerMock,
                },
                provideMockStore(),
                {
                    provide: MatDialog,
                    useValue: mockDialogSpy,
                },
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
        store.overrideSelector('players', { player: { name: 'Name' } });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SurrenderGameButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('openConfirmSurrenderDialog should open the window when the begin button is clicked', () => {
        component.openConfirmSurrenderDialog();
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });

    it('quitGamePage should open the window when the begin button is clicked', () => {
        component.quitGamePage();
        expect(routerMock.navigateByUrl).toHaveBeenCalled();
    });

    it('quitGamePage should dispatch a message to tell opponent player quit', () => {
        // eslint-disable-next-line dot-notation
        const dispatchSpy = spyOn(component['store'], 'dispatch');
        component.quitGamePage();
        const expectedMessage = { username: '', message: 'Name a quitté le jeu', messageType: 'System' };
        expect(dispatchSpy).toHaveBeenCalledWith(messageWritten(expectedMessage));
    });
});
