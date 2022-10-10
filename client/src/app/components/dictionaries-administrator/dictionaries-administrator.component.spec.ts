import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { deleteDictionary, downloadDictionary, resetDictionaries } from '@app/actions/dictionaries.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { iDictionary } from 'common/interfaces/dictionary';
import { cold } from 'jasmine-marbles';
import { DictionariesAdministratorComponent } from './dictionaries-administrator.component';

describe('DictionariesAdministratorComponent', () => {
    let component: DictionariesAdministratorComponent;
    let fixture: ComponentFixture<DictionariesAdministratorComponent>;
    let store: MockStore;
    const mockDialogSpy: { open: jasmine.Spy } = {
        open: jasmine.createSpy('open').and.returnValue({ componentInstance: { fileRequired: false, currentDictionary: {} } }),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [DictionariesAdministratorComponent],
            providers: [
                provideMockStore(),
                {
                    provide: MatDialog,
                    useValue: mockDialogSpy,
                },
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DictionariesAdministratorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('addDictionary should open a matDialog', () => {
        component.addDictionary();
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });

    it('resetDictionaries should dispatch resetDictionaries', () => {
        component.resetDictionaries();
        const expectedAction = cold('a', { a: resetDictionaries() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('modifyDictionary should open a dialog', () => {
        component.modifyDictionary(0, {} as iDictionary);
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });

    it('deleteDictionary should dispatch deleteDictionary', () => {
        const deletedDictionary = { title: 'Deleted' } as iDictionary;
        component.deleteDictionary(deletedDictionary);
        const expectedAction = cold('a', { a: deleteDictionary({ dictionary: deletedDictionary }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('downloadDictionary should dispatch downloadDictionary', () => {
        const selectedDictionary = { title: 'Deleted' } as iDictionary;
        component.downloadDictionary(selectedDictionary);
        const expectedAction = cold('a', { a: downloadDictionary({ dictionary: selectedDictionary }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });
});
