import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { acceptInvite, closeRoom, refuseInvite, switchToSoloRoom } from '@app/actions/room.actions';
import { AppMaterialModule } from '@app/modules/material.module';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { WaitingRoomComponent } from './waiting-room.component';

describe('WaitingRoomComponent', () => {
    let component: WaitingRoomComponent;
    let fixture: ComponentFixture<WaitingRoomComponent>;
    const mockDialogSpy: { close: jasmine.Spy } = {
        close: jasmine.createSpy('close'),
    };

    let store: jasmine.SpyObj<Store>;

    beforeEach(async () => {
        store = jasmine.createSpyObj<Store>('store', ['dispatch', 'select']);

        await TestBed.configureTestingModule({
            declarations: [WaitingRoomComponent],
            imports: [AppMaterialModule, BrowserAnimationsModule, FormsModule],
            providers: [
                FormBuilder,
                {
                    provide: MatDialogRef,
                    useValue: mockDialogSpy,
                },
                {
                    provide: Store,
                    useValue: store,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close the window and dispatch "[Room] Accept Invite" when the begin button is clicked', () => {
        component.acceptInvite();
        expect(store.dispatch).toHaveBeenCalledWith(acceptInvite());
        expect(mockDialogSpy.close).toHaveBeenCalled();
    });

    it('The démarrer button should be enabled when player 2 is coming', () => {
        component.player2$ = of('Johnson');
        fixture.detectChanges();
        const beginButton = document.getElementsByTagName('button')[1];
        expect(beginButton.disabled).toBeFalse();
    });

    it('should hide the waiting-section if the player 2 is here', () => {
        component.player2$ = of('Johnson');
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#waiting-section'))).toBeNull();
    });

    it('should dispatch "[Room] Refuse Invite" when clicking on "refuser"', () => {
        component.rejectInvite();
        expect(store.dispatch).toHaveBeenCalledWith(refuseInvite());
    });

    it('should dispatch "[Room] Close room" when clicking on "Annuler"', () => {
        component.quitWaitingRoom();
        expect(store.dispatch).toHaveBeenCalledWith(closeRoom());
    });

    it('should dispatch "[Room] Switch To Solo Room" when convertToSolo called', () => {
        component.convertToSolo();
        expect(store.dispatch).toHaveBeenCalledWith(switchToSoloRoom({ botLevel: 'Débutant' }));
    });
});
