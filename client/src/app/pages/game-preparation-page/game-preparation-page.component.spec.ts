/* eslint-disable dot-notation */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { createRoom } from '@app/actions/room.actions';
import { MultiConfigWindowComponent } from '@app/components/multi-config-window/multi-config-window.component';
import { WaitingRoomComponent } from '@app/components/waiting-room/waiting-room.component';
import { RoomEffects } from '@app/effects/room.effects';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { AppMaterialModule } from '@app/modules/material.module';
import { SocketClientService } from '@app/services/socket-client.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { GameOptions } from 'common/classes/game-options';
import { cold } from 'jasmine-marbles';
import { GamePreparationPageComponent } from './game-preparation-page.component';

describe('GamePreparationPageComponent', () => {
    let component: GamePreparationPageComponent;
    let fixture: ComponentFixture<GamePreparationPageComponent>;
    let store: MockStore;

    beforeEach(async () => {
        const socketHelper = new SocketTestHelper();
        await TestBed.configureTestingModule({
            declarations: [GamePreparationPageComponent, MultiConfigWindowComponent, WaitingRoomComponent],
            imports: [AppMaterialModule, BrowserAnimationsModule, ReactiveFormsModule],
            providers: [
                FormBuilder,
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: RoomEffects,
                    useValue: { roomCreationStepper: MatStepper },
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
                provideMockStore(),
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePreparationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return multiConfigWindowComponent.settingsForm if multiConfigWindowComponent is initialized ', () => {
        component['multiConfigWindowComponent'] = jasmine.createSpyObj('MultiConfigWindowComponent', [], ['formSettings']);
        expect(component.formSettings).toEqual(component['multiConfigWindowComponent'].settingsForm);
    });

    it('should not return multiConfigWindowComponent.settingsForm if multiConfigWindowComponent is initialized ', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        component['multiConfigWindowComponent'] = undefined!;
        expect(component.formSettings).toEqual(component.firstFormGroup);
    });

    it('should dispatch createRoom with the gameOptions when onGameOptionsSubmit called', () => {
        const expectedOptions = { name: 'My Name' } as unknown as GameOptions;
        component.onGameOptionsSubmit(expectedOptions);
        const expectedAction = cold('a', { a: createRoom({ gameOptions: expectedOptions }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });
});
