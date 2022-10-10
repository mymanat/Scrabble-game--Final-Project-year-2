/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { addBotName, modifyBotName } from '@app/actions/bot-names.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { BotNameFormDialogComponent } from './bot-name-form-dialog.component';

describe('BotNameFormDialogComponent', () => {
    const mockDialogSpy: { close: jasmine.Spy } = {
        close: jasmine.createSpy('close'),
    };

    const mockSnackBarSpy: { open: jasmine.Spy } = {
        open: jasmine.createSpy('open'),
    };

    let component: BotNameFormDialogComponent;
    let fixture: ComponentFixture<BotNameFormDialogComponent>;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppMaterialModule, BrowserAnimationsModule, ReactiveFormsModule],
            declarations: [BotNameFormDialogComponent],
            providers: [
                FormBuilder,
                provideMockStore({
                    selectors: [
                        {
                            selector: 'botNames',
                            value: { easy: ['ROB'], hard: ['MIKE'] },
                        },
                    ],
                }),
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: MatDialogRef,
                    useValue: mockDialogSpy,
                },
                {
                    provide: MatSnackBar,
                    useValue: mockSnackBarSpy,
                },
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BotNameFormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should change validator if oldName is not undefined', () => {
        const oldName = 'Title';
        component.oldName = oldName;
        component.ngOnInit();
        expect(component.settingsForm.controls.difficulty.validator).toEqual(Validators.nullValidator);
    });

    it('onSubmit should dispatch addBotName with name and difficulty if oldName is undefined', () => {
        const name = 'My NAme';
        const difficulty = 'Débutant';
        component.settingsForm.controls.name.setValue(name);
        component.settingsForm.controls.difficulty.setValue(difficulty);
        const expectedAction = cold('a', { a: addBotName({ name, difficulty }) });
        component.onSubmit();
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('onSubmit should dispatch addBotName with name and difficulty if oldName is undefined and close dialogRef', () => {
        const name = 'My NAme';
        const difficulty = 'Débutant';
        component.settingsForm.controls.name.setValue(name);
        component.settingsForm.controls.difficulty.setValue(difficulty);
        const expectedAction = cold('a', { a: addBotName({ name, difficulty }) });
        component.onSubmit();
        expect(store.scannedActions$).toBeObservable(expectedAction);
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('onSubmit should dispatch modifyBotName with names and difficulty if oldName is no undefined and close dialogRef', () => {
        const name = 'My NAme';
        const difficulty = 'Débutant';
        const oldName = 'Title';

        component.settingsForm.controls.name.setValue(name);
        component.currentDifficulty = difficulty;
        component.oldName = oldName;
        const expectedAction = cold('a', { a: modifyBotName({ oldName, newName: name, difficulty }) });
        component.onSubmit();
        expect(store.scannedActions$).toBeObservable(expectedAction);
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('onSubmit should call dispatchError if verifyNameValidity return true', () => {
        spyOn(component as any, 'verifyNameValidity').and.callFake(() => true);
        const dispatchErrorSpy = spyOn(component as any, 'dispatchError');
        component.onSubmit();
        expect(dispatchErrorSpy).toHaveBeenCalled();
    });

    it('verifyNameValidity should return false if name not in easy or hard bot names', () => {
        const name = 'randomName';
        expect(component['verifyNameValidity'](name)).toBeFalse();
    });

    it('verifyNameValidity should return true if name in easy bot names', () => {
        const name = 'ROB';
        expect(component['verifyNameValidity'](name)).toBeTrue();
    });

    it('verifyNameValidity should return true if name in hard bot names', () => {
        const name = 'MIKE';
        expect(component['verifyNameValidity'](name)).toBeTrue();
    });

    it('dispatchError should call open from snackBar', () => {
        const message = 'Message';
        component['dispatchError'](message);
        expect(mockSnackBarSpy.open).toHaveBeenCalled();
    });
});
