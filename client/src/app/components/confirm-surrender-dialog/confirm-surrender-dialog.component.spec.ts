import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { resetSocketConnection, surrender } from '@app/actions/player.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { EffectsRootModule } from '@ngrx/effects';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { ConfirmSurrenderDialogComponent } from './confirm-surrender-dialog.component';

describe('ConfirmSurrenderComponent', () => {
    let component: ConfirmSurrenderDialogComponent;
    let fixture: ComponentFixture<ConfirmSurrenderDialogComponent>;
    let store: MockStore;
    const mockDialogSpy: { close: jasmine.Spy } = {
        close: jasmine.createSpy('close'),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmSurrenderDialogComponent],
            imports: [AppMaterialModule, BrowserAnimationsModule, EffectsRootModule],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                {
                    provide: MatDialogRef,
                    useValue: mockDialogSpy,
                },
                {
                    provide: EffectsRootModule,
                    useValue: {
                        addEffects: jasmine.createSpy('addEffects'),
                    },
                },
                provideMockStore(),
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmSurrenderDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch [Players] resetSocketConnection when clicked', () => {
        component.surrenderGame();
        const expectedAction = cold('a', { a: resetSocketConnection() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch [Players] surrender when clicked', () => {
        const dispatchSpy = spyOn(store, 'dispatch');
        component.surrenderGame();
        expect(dispatchSpy).toHaveBeenCalledWith(surrender());
    });

    it('should close the window when the accept button is clicked', () => {
        component.closeDialog();
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('should call the closeDialog method when surrenderGame is called', () => {
        const spy = spyOn(component, 'closeDialog');
        component.surrenderGame();
        expect(spy).toHaveBeenCalled();
    });
});
