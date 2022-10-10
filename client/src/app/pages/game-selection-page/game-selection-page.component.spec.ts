import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { provideMockStore } from '@ngrx/store/testing';
import { GameSelectionPageComponent } from './game-selection-page.component';

describe('GameSelectionPageComponent', () => {
    let component: GameSelectionPageComponent;
    let fixture: ComponentFixture<GameSelectionPageComponent>;
    const mockDialogSpy: { open: jasmine.Spy } = {
        open: jasmine.createSpy('open'),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameSelectionPageComponent],
            imports: [AppMaterialModule, BrowserAnimationsModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockDialogSpy,
                },
                FormBuilder,
                provideMockStore(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameSelectionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open the window when the solo button is clicked', () => {
        component.openSoloSettingsPage();
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });

    it('should open the window when the multiplayer button is clicked', () => {
        component.openGamePreparationPage();
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });

    it('should open the window when the join button is clicked', () => {
        component.openGameJoinPage();
        expect(mockDialogSpy.open).toHaveBeenCalled();
    });
});
