import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import {
    acceptInvite,
    cancelJoinRoom,
    closeRoom,
    createRoom,
    createSoloRoom,
    joinRoom,
    joinRoomAccepted,
    loadRooms,
    refuseInvite,
    switchToSoloRoom,
} from '@app/actions/room.actions';
import { GameJoinPageComponent } from '@app/pages/game-join-page/game-join-page.component';
import { RoomService } from '@app/services/room.service';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { GameOptions } from 'common/classes/game-options';
import { RoomInfo } from 'common/classes/room-info';
import { GameMode } from 'common/interfaces/game-mode';
import { Observable, of } from 'rxjs';
import { RoomEffects } from './room.effects';

describe('RoomEffects', () => {
    let actions$: Observable<unknown>;
    let effects: RoomEffects;

    let routerMock: jasmine.SpyObj<Router>;
    let roomService: jasmine.SpyObj<RoomService>;

    const timer = 60;
    let gameOptionsStub: GameOptions;
    let roomInfoStub: RoomInfo;
    let playerNameStub: string;

    beforeEach(() => {
        routerMock = jasmine.createSpyObj('router', ['navigateByUrl']);
        roomService = jasmine.createSpyObj('roomService', [
            'createRoom',
            'createSoloRoom',
            'closeRoom',
            'joinRoom',
            'acceptInvite',
            'fetchRoomList',
            'refuseInvite',
            'acceptInvite',
            'switchToSoloRoom',
            'cancelJoinRoom',
        ]);
        TestBed.configureTestingModule({
            providers: [
                RoomEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                {
                    provide: Router,
                    useValue: routerMock,
                },
                {
                    provide: RoomService,
                    useValue: roomService,
                },
            ],
        });

        effects = TestBed.inject(RoomEffects);

        gameOptionsStub = new GameOptions('host', 'dict', GameMode.Classical, timer);
        roomInfoStub = new RoomInfo('id', gameOptionsStub);
        playerNameStub = 'player 1';
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });

    it('createRoomEffect$ should call the createRoom from room service', () => {
        actions$ = of(createRoom({ gameOptions: gameOptionsStub }));
        effects.createRoomEffect$.subscribe();
        expect(roomService.createRoom).toHaveBeenCalledWith(gameOptionsStub);
    });

    it('createSoloRoomEffect$ should call the createSoloRoom from room service', () => {
        const botLevel = 'Debutant';
        actions$ = of(createSoloRoom({ gameOptions: gameOptionsStub, botLevel }));
        effects.createSoloRoomEffect$.subscribe();
        expect(roomService.createSoloRoom).toHaveBeenCalledWith(gameOptionsStub, botLevel);
    });

    it('switchToSoloRoomEffect$ should call the switchToSoloRoom from room service', () => {
        const botLevel = 'Debutant';
        actions$ = of(switchToSoloRoom({ botLevel }));
        effects.switchToSoloRoomEffect$.subscribe();
        expect(roomService.switchToSoloRoom).toHaveBeenCalledWith(botLevel);
    });

    it('closeRoomEffect$ should call the closeRoom from room service', () => {
        let resetCalled = false;
        effects.roomCreationStepper = {
            reset: () => {
                resetCalled = true;
                return;
            },
        } as unknown as MatStepper;
        actions$ = of(closeRoom());
        effects.closeRoomEffect$.subscribe();
        expect(roomService.closeRoom).toHaveBeenCalled();
        expect(resetCalled).toBeTrue();
    });

    it('closeRoomEffect$ should call the closeRoom from room service even if the stepper is undefined', () => {
        effects.roomCreationStepper = undefined as unknown as MatStepper;
        actions$ = of(closeRoom());
        effects.closeRoomEffect$.subscribe();
        expect(roomService.closeRoom).toHaveBeenCalled();
    });

    it('refuseInviteEffect$ should call the refuseInvite from room service', () => {
        actions$ = of(refuseInvite());
        effects.refuseInviteEffect$.subscribe();
        expect(roomService.refuseInvite).toHaveBeenCalled();
    });

    it('acceptInviteEffect$ should call the acceptInvite from room service', () => {
        actions$ = of(acceptInvite());
        effects.acceptInviteEffect$.subscribe();
        expect(roomService.acceptInvite).toHaveBeenCalled();
    });

    it('loadRoomsEffect$ should call the fetchRoomList from room service', () => {
        actions$ = of(loadRooms());
        effects.loadRoomsEffect$.subscribe();
        expect(roomService.fetchRoomList).toHaveBeenCalled();
    });

    it('joinRoomEffect$ should call the joinRoom from room service', () => {
        actions$ = of(joinRoom({ roomInfo: roomInfoStub, playerName: playerNameStub }));
        effects.joinRoomEffect$.subscribe();
        expect(roomService.joinRoom).toHaveBeenCalledWith(roomInfoStub, playerNameStub);
    });

    it('acceptedRoomEffect$ should change page and close the dialog box', () => {
        const dialogMock = jasmine.createSpyObj<MatDialogRef<GameJoinPageComponent>>('dialogRef', ['close']);
        effects.dialogRef = dialogMock;
        actions$ = of(joinRoomAccepted({ roomInfo: roomInfoStub, playerName: playerNameStub }));
        effects.acceptedRoomEffect$.subscribe();
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('game');
        expect(dialogMock.close).toHaveBeenCalled();
    });

    it('cancelJoinRoomEffect$ should call the cancelJoinRoom from room service', () => {
        actions$ = of(cancelJoinRoom({ roomInfo: roomInfoStub }));
        effects.cancelJoinRoomEffect$.subscribe();
        expect(roomService.cancelJoinRoom).toHaveBeenCalled();
    });
});
