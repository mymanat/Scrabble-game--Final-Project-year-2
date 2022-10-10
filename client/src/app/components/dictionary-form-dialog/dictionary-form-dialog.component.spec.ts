import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { addDictionary, modifyDictionary } from '@app/actions/dictionaries.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { iDictionary } from 'common/interfaces/dictionary';
import { cold } from 'jasmine-marbles';
import { DictionaryFormDialogComponent } from './dictionary-form-dialog.component';

describe('DictionaryFormDialogComponent', () => {
    const mockDialogSpy: { close: jasmine.Spy } = {
        close: jasmine.createSpy('close'),
    };
    const mockSnackBarSpy: { open: jasmine.Spy } = {
        open: jasmine.createSpy('open'),
    };

    const waitingAsyncTime = 200;
    let component: DictionaryFormDialogComponent;
    let fixture: ComponentFixture<DictionaryFormDialogComponent>;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, FormsModule, AppMaterialModule, BrowserAnimationsModule],
            declarations: [DictionaryFormDialogComponent],
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'dictionaries',
                            value: [{ title: 'My Dict', description: 'description' }],
                        },
                    ],
                }),
                FormBuilder,
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
        fixture = TestBed.createComponent(DictionaryFormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should change validator if fileRequired is true and currentDictionary is defined', () => {
        const dictionary = { title: 'Title', description: 'This dict' };
        component.currentDictionary = dictionary;
        component.fileRequired = true;
        component.ngOnInit();
        expect(component.settingsForm.controls.file.validator).toEqual(Validators.required);
        expect(component.settingsForm.controls.title.value).toEqual(dictionary.title);
        expect(component.settingsForm.controls.description.value).toEqual(dictionary.description);
    });

    it('onFileSelected should disable the settingsForm inputs', (done) => {
        const dictionary = { title: 'Title', description: 'This dict', words: ['aa'] };
        const file = {
            name: 'something.json',
            text: async () => {
                return new Promise<string>((resolve) => {
                    resolve(JSON.stringify(dictionary));
                });
            },
        };
        const event = { target: { files: [file] } };
        component.onFileSelected(event as unknown as Event);
        setTimeout(() => {
            expect(component.settingsForm.controls.title.disabled).toBeTruthy();
            expect(component.settingsForm.controls.description.disabled).toBeTruthy();
            done();
        }, waitingAsyncTime);
    });

    it('onFileSelected should call dispatchFileError if extension is not json', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dispatchFileErrorSpy = spyOn(component as any, 'dispatchFileError');
        const file = {
            name: 'something.notJson',
        };
        const event = { target: { files: [file] } };
        component.onFileSelected(event as unknown as Event);
        expect(dispatchFileErrorSpy).toHaveBeenCalledWith('Mauvaise extention de fichier');
    });

    it('onFileSelected should call dispatchFileError if there is no title in dictionary', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dispatchFileErrorSpy = spyOn(component as any, 'dispatchFileError');
        const dictionary = { description: 'This dict', words: ['aa'] };
        const file = {
            name: 'something.json',
            text: async () => {
                return new Promise<string>((resolve) => {
                    resolve(JSON.stringify(dictionary));
                });
            },
        };
        const event = { target: { files: [file] } };
        component.onFileSelected(event as unknown as Event);
        setTimeout(() => {
            expect(dispatchFileErrorSpy).toHaveBeenCalledWith('Mauvais attributs dans le fichier json');
            done();
        }, waitingAsyncTime);
    });

    it('onFileSelected should call dispatchFileError if there is no description in dictionary', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dispatchFileErrorSpy = spyOn(component as any, 'dispatchFileError');
        const dictionary = { title: 'This dict', words: ['aa'] };
        const file = {
            name: 'something.json',
            text: async () => {
                return new Promise<string>((resolve) => {
                    resolve(JSON.stringify(dictionary));
                });
            },
        };
        const event = { target: { files: [file] } };
        component.onFileSelected(event as unknown as Event);
        setTimeout(() => {
            expect(dispatchFileErrorSpy).toHaveBeenCalledWith('Mauvais attributs dans le fichier json');
            done();
        }, waitingAsyncTime);
    });

    it('onFileSelected should call dispatchFileError if there is no words in dictionary', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dispatchFileErrorSpy = spyOn(component as any, 'dispatchFileError');
        const dictionary = { title: 'This dict', description: 'aa' };
        const file = {
            name: 'something.json',
            text: async () => {
                return new Promise<string>((resolve) => {
                    resolve(JSON.stringify(dictionary));
                });
            },
        };
        const event = { target: { files: [file] } };
        component.onFileSelected(event as unknown as Event);
        setTimeout(() => {
            expect(dispatchFileErrorSpy).toHaveBeenCalledWith('Mauvais attributs dans le fichier json');
            done();
        }, waitingAsyncTime);
    });

    it('onSubmit should dispatch modifyDictionary if dictionaryIndex and currentDictionary are not null', () => {
        const oldDictionary = { title: 'Title', description: 'This dict' };
        const newDictionary = { title: 'NEW Title', description: 'This new dict' };
        component.settingsForm.controls.title.setValue('title');
        component.dictionaryIndex = 1;
        component.currentDictionary = oldDictionary;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(component as any, 'getFormDictionary').and.callFake(() => newDictionary);
        const expectedAction = cold('a', { a: modifyDictionary({ oldDictionary, newDictionary }) });
        component.onSubmit();
        expect(store.scannedActions$).toBeObservable(expectedAction);
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('onSubmit should dispatch addDictionary if loadedDictionary is not null', () => {
        const dictionary = { title: 'Title', description: 'This dict' };
        component.settingsForm.controls.title.setValue('title');
        const expectedFile = {} as File;
        component.loadedDictionary = {} as iDictionary;
        component.loadedFile = expectedFile;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(component as any, 'getFormDictionary').and.callFake(() => dictionary);
        const expectedAction = cold('a', { a: addDictionary({ file: expectedFile, dictionary }) });
        component.onSubmit();
        expect(store.scannedActions$).toBeObservable(expectedAction);
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('onSubmit should close dialog if all attributes are null', () => {
        component.settingsForm.controls.title.setValue('title');
        component.onSubmit();
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('onSubmit should call dispatchFileError if dictionary title chosen is the same as another one', () => {
        component.settingsForm.controls.title.setValue('My Dict');
        component.dictionaryIndex = 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dispatchErrorSpy = spyOn(component as any, 'dispatchFileError');
        component.onSubmit();
        expect(dispatchErrorSpy).toHaveBeenCalledOnceWith('Titre de dictionnaire déjà existant');
    });

    it('getFormDictionary should return a dictionary with given values', () => {
        const title = 'Title';
        const description = 'This dict';
        const dictionary = { title, description };
        component.settingsForm.controls.title.setValue(title);
        component.settingsForm.controls.description.setValue(description);
        // eslint-disable-next-line dot-notation
        expect(component['getFormDictionary']()).toEqual(dictionary);
    });

    it('dispatchFileError should call open from snackBar and reset all inputs', () => {
        const message = 'Message';
        component.settingsForm.controls.title.setValue('Hello');
        component.settingsForm.controls.description.setValue('World');
        component.settingsForm.controls.file.setValue('!!!!');
        // eslint-disable-next-line dot-notation
        component['dispatchFileError'](message);
        expect(mockSnackBarSpy.open).toHaveBeenCalled();
        expect(component.settingsForm.controls.title.value).toEqual('');
        expect(component.settingsForm.controls.description.value).toEqual('');
        expect(component.settingsForm.controls.file.value).toEqual('');
    });
});
