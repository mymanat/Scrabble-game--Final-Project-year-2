import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { deleteBotName, loadBotNames, resetBotNames } from '@app/actions/bot-names.actions';
import { BotNameFormDialogComponent } from '@app/components/bot-name-form-dialog/bot-name-form-dialog.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { BotAdminComponent } from './bot-name-admin.component';

describe('DictionariesAdministratorComponent', () => {
    const mockDialogSpy: { open: jasmine.Spy } = {
        open: jasmine.createSpy('open').and.returnValue({ componentInstance: { oldName: '', currentBotName: '', currentDifficulty: '' } }),
    };
    let component: BotAdminComponent;
    let fixture: ComponentFixture<BotAdminComponent>;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [BotAdminComponent, BotNameFormDialogComponent],
            providers: [
                provideMockStore(),
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: MatDialog,
                    useValue: mockDialogSpy,
                },
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BotAdminComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and dispatch loadBotNames', () => {
        const expectedAction = cold('a', { a: loadBotNames() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
        expect(component).toBeTruthy();
    });

    it('reset should dispatch resetBotNames', () => {
        component.reset();
        const expectedAction = cold('a', { a: resetBotNames() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('add should open a matDialog', () => {
        component.add();
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });

    it('edit should open a matDialog', () => {
        const expectedName = 'Jackie';
        const expectedDifficulty = 'Débutant';
        component.edit(expectedName, expectedDifficulty);
        const newMockDialog = mockDialogSpy.open();
        expect(mockDialogSpy.open).toHaveBeenCalled();
        expect(newMockDialog.componentInstance.oldName).toEqual(expectedName);
        expect(newMockDialog.componentInstance.currentBotName).toEqual(expectedName);
        expect(newMockDialog.componentInstance.currentDifficulty).toEqual(expectedDifficulty);
    });

    it('delete should dispatch deleteBotName', () => {
        const expectedName = 'My name';
        const expectedDifficulty = 'Débutant';
        component.delete(expectedName, expectedDifficulty);
        const expectedAction = cold('a', { a: deleteBotName({ name: expectedName, difficulty: expectedDifficulty }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('botNameNotChangeable should return false if the botName is not in the default ones', () => {
        const name = 'My name';
        expect(component.botNameNotChangeable(name)).toBeFalse();
    });

    it('botNameNotChangeable should return true if the botName is part of default easy names', () => {
        const name = 'BOB';
        expect(component.botNameNotChangeable(name)).toBeTrue();
    });

    it('botNameNotChangeable should return true if the botName is part of default hard names', () => {
        const name = 'OLA';
        expect(component.botNameNotChangeable(name)).toBeTrue();
    });
});
