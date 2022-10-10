/* eslint-disable dot-notation */
import { CdkStep } from '@angular/cdk/stepper';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { cancelJoinRoom, joinRoom, loadRooms } from '@app/actions/room.actions';
import { RoomEffects } from '@app/effects/room.effects';
import { AppMaterialModule } from '@app/modules/material.module';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { RoomInfo } from 'common/classes/room-info';
import { GameMode } from 'common/interfaces/game-mode';
import { cold } from 'jasmine-marbles';
import { forbiddenNameValidator, GameJoinPageComponent } from './game-join-page.component';
const FIXTURE_COOLDOWN = 10;

describe('GameJoinPageComponent', () => {
    let component: GameJoinPageComponent;
    let fixture: ComponentFixture<GameJoinPageComponent>;
    let store: MockStore;
    const stepperMock: jasmine.SpyObj<MatStepper> = jasmine.createSpyObj<MatStepper>('stepper', ['next', 'reset']);

    const roomInfoStub: RoomInfo = {
        roomId: 'id',
        gameOptions: { dictionaryType: 'dict', hostname: 'host', gameMode: GameMode.Classical, timePerRound: 60 },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameJoinPageComponent],
            imports: [ReactiveFormsModule, FormsModule, AppMaterialModule, BrowserAnimationsModule],
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'room',
                            value: undefined,
                        },
                    ],
                }),
                {
                    provide: RoomEffects,
                    useValue: jasmine.createSpyObj('roomEffects', [], ['dialogRef']),
                },
                { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameJoinPageComponent);
        component = fixture.componentInstance;
        component['stepper'] = stepperMock;
        setTimeout(() => fixture.detectChanges, FIXTURE_COOLDOWN);
    });

    afterEach(() => {
        component.selectedRoom = undefined;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('timerTString should return a timer in minute format', () => {
        const time = 60;
        const expectedResult = '1:00 min';
        expect(component.timerToString(time)).toEqual(expectedResult);
    });

    it('timerTString should return one minute in string if no timer is given', () => {
        const expectedResult = '1:00 min';
        expect(component.timerToString()).toEqual(expectedResult);
    });

    it('should dispatch "[Room] Load Rooms" when constructor', () => {
        const expectedAction = cold('a', { a: loadRooms() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('selectRoom should set the selectedRoom with the room infos', () => {
        component.selectRoom(roomInfoStub);
        expect(component.selectedRoom).toBe(roomInfoStub);
    });

    it('joinRoom should dispatch "[Room] Join Room" with the selected room', () => {
        component.selectRoom(roomInfoStub);
        const username = 'username';
        component.formGroup.controls.name.setValue(username);

        component.joinGame();

        const expectedAction = cold('a', { a: joinRoom({ playerName: username, roomInfo: roomInfoStub }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('joinRoom should not dispatch "[Room] Join Room" if the selected room is undefined', () => {
        component.joinGame();

        const expectedAction = cold('a', { a: loadRooms() });
        expect(store.scannedActions$).toBeObservable(expectedAction);

        expect(component.formGroup.controls.name.enabled).toBeTruthy();
    });

    it('cancelJoin should dispatch "[Room] Cancel Join Room", unselect the room and reenable the name field', () => {
        component.selectRoom(roomInfoStub);
        component.formGroup.controls.name.disable();

        component.cancelJoin();

        const expectedAction = cold('a', { a: cancelJoinRoom({ roomInfo: roomInfoStub }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);

        expect(component.selectedRoom).toBeUndefined();
        expect(component.formGroup.controls.name.enabled).toBeTruthy();
        expect(stepperMock.reset).toHaveBeenCalled();
    });

    it('cancelJoin should not dispatch "[Room] Cancel Join Room" if the selected room is undefined', () => {
        component.cancelJoin();

        const expectedAction = cold('a', { a: loadRooms() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('unselect should call re-setup the validator with no host names', () => {
        const spyOnSetupValidator = spyOn(component, 'setupNameValidators');

        component.unSelectRoom();

        expect(spyOnSetupValidator).toHaveBeenCalledWith('');
    });

    it('Our custom forbidden name custom validator should return a validation error only if hostname === player name', () => {
        const hostName = 'host';
        const customValidator = forbiddenNameValidator(hostName);
        const nameControl = component.formGroup.controls.name;

        nameControl.setValue(hostName);
        expect(customValidator(nameControl)).toEqual({ forbiddenName: { value: hostName } });

        nameControl.setValue('a new player');
        expect(customValidator(nameControl)).toBeNull();
    });

    it('onStepChange should closeRoom if stepper is selecting the first page', () => {
        let stepper = { selected: { editable: true } as CdkStep } as MatStepper;
        component['stepper'] = stepper;

        const spyOnCloseRoom = spyOn(component, 'cancelJoin');

        component.onStepChange();
        expect(spyOnCloseRoom).not.toHaveBeenCalled();

        stepper = { selected: { editable: false } as CdkStep } as MatStepper;
        component['stepper'] = stepper;

        component.onStepChange();
        expect(spyOnCloseRoom).toHaveBeenCalled();
    });

    it('onStepChange should closeRoom if selected is undefined', () => {
        const stepper = {} as MatStepper;
        component['stepper'] = stepper;

        const spyOnCloseRoom = spyOn(component, 'cancelJoin');

        component.onStepChange();
        expect(spyOnCloseRoom).toHaveBeenCalled();
    });
});

describe('Join room in Join Page Component with undefined selector', () => {
    let store: MockStore;
    let component: GameJoinPageComponent;
    let fixture: ComponentFixture<GameJoinPageComponent>;
    const stepperMock: jasmine.SpyObj<MatStepper> = jasmine.createSpyObj<MatStepper>('stepper', ['next', 'reset']);
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameJoinPageComponent],
            imports: [ReactiveFormsModule, FormsModule, AppMaterialModule, BrowserAnimationsModule],
            providers: [
                provideMockStore(),
                {
                    provide: RoomEffects,
                    useValue: jasmine.createSpyObj('roomEffects', [], ['dialogRef']),
                },
                { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
            ],
        }).compileComponents();
        store = TestBed.inject(MockStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameJoinPageComponent);
        component = fixture.componentInstance;
        component['stepper'] = stepperMock;
        setTimeout(() => fixture.detectChanges, FIXTURE_COOLDOWN);
    });

    it('roomListLength should return the length of roomList', () => {
        store.overrideSelector('room', [{} as RoomInfo]);
        component.roomList$ = store.select('room');
        const expectedLength = 1;
        expect(component.roomListLength()).toEqual(expectedLength);
    });

    it('selectRandomRoom should call selectRoom with a number between 0 and the roomList size - 1', () => {
        store.overrideSelector('room', [{}, {}, {}]);
        component.roomList$ = store.select('room');
        const selectRoomSpy = spyOn(component, 'selectRoom');
        const roomLength = 3;
        component.selectRandomRoom();
        expect(selectRoomSpy).toHaveBeenCalled();
        expect(selectRoomSpy.arguments).toBeLessThanOrEqual(roomLength - 1);
        expect(selectRoomSpy.arguments).toBeGreaterThanOrEqual(0);
    });

    it('joinRoom should not dispatch "[Room] Join Room" if the selected room is undefined', () => {
        store.overrideSelector('room', {});
        component.pendingRoom$ = store.select('room');
        const roomInfoStub = {
            roomId: 'id',
            gameOptions: { dictionaryType: 'dict', hostname: 'host', gameMode: GameMode.Classical, timePerRound: 60 },
        };
        component.selectRoom(roomInfoStub);
        const username = 'username';
        component.formGroup.controls.name.setValue(username);
        component.joinGame();
        const expectedAction = cold('a', { a: joinRoom({ playerName: username, roomInfo: roomInfoStub }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });
});
