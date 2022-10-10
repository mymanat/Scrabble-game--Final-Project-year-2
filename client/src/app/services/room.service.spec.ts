import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    closeRoom,
    createRoomSuccess,
    joinInviteCanceled,
    joinInviteReceived,
    joinRoomAccepted,
    joinRoomDeclined,
    loadRoomsSuccess,
} from '@app/actions/room.actions';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { GameOptions } from 'common/classes/game-options';
import { RoomInfo } from 'common/classes/room-info';
import { GameMode } from 'common/interfaces/game-mode';
import { cold } from 'jasmine-marbles';
import { Socket } from 'socket.io-client';
import { RoomService } from './room.service';
import { SocketClientService } from './socket-client.service';

describe('RoomService', () => {
    const timer = 60;
    const botLevel = 'Debutant';
    const gameOptions = new GameOptions('host', 'dict', GameMode.Classical, timer);
    let service: RoomService;
    let socketService: SocketTestHelper;
    let store: MockStore;

    beforeEach(() => {
        socketService = new SocketTestHelper();
        TestBed.configureTestingModule({
            providers: [
                provideMockStore(),
                {
                    provide: MatSnackBar,
                    useValue: {
                        open: () => {
                            return;
                        },
                    },
                },
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketService,
                        send: (value: string, data?: unknown) => {
                            if (!data) socketService.emit(value);
                            if (data) socketService.emit(value, data);
                            return;
                        },
                        on: (event: string, callback: () => void) => {
                            socketService.on(event, callback);
                            return;
                        },
                    },
                },
            ],
        });
        service = TestBed.inject(RoomService);
        TestBed.inject(SocketClientService).socket = socketService as unknown as Socket;
        store = TestBed.inject(MockStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send a create room request to socket and wait for the answer', () => {
        const sendSpy = spyOn(socketService, 'emit');
        const onSpy = spyOn(socketService, 'on');

        service.createRoom(gameOptions);

        expect(sendSpy).toHaveBeenCalledWith('create room', gameOptions);
        expect(onSpy).toHaveBeenCalled();
    });

    it('should dispatch "[Room] Create Room Success" for the create room success and wait for invitations', () => {
        const waitForInvitationsSpy = spyOn(service, 'waitForInvitations');

        service.createRoom(gameOptions);

        const roomInfo: RoomInfo = { roomId: 'room-id', gameOptions };
        socketService.peerSideEmit('create room success', roomInfo);

        const expectedAction = cold('a', { a: createRoomSuccess({ roomInfo }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);

        expect(waitForInvitationsSpy).toHaveBeenCalled();
    });

    it('should dispatch "[Room] Close Room" if deleted dictionary is the one used', () => {
        service.createRoom(gameOptions);

        socketService.peerSideEmit('dictionary deleted', 'dict');

        const expectedAction = cold('a', { a: closeRoom() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should not dispatch "[Room] Close Room" if deleted dictionary is not the one used', () => {
        const dispatchSpy = spyOn(store, 'dispatch');

        service.createRoom(gameOptions);

        socketService.peerSideEmit('dictionary deleted', 'other dict');

        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should wait invitations from the server', () => {
        const onSpy = spyOn(socketService, 'on');

        service.waitForInvitations();

        expect(onSpy).toHaveBeenCalled();
    });

    it('should send a create solo room request to socket and wait for the answer', () => {
        const sendSpy = spyOn(socketService, 'emit');
        const onSpy = spyOn(socketService, 'on');

        service.createSoloRoom(gameOptions, botLevel);

        expect(sendSpy).toHaveBeenCalledWith('create solo room', { gameOptions, botLevel });
        expect(onSpy).toHaveBeenCalled();
    });

    it('should dispatch "[Room] Create Room Success" for the create room success', () => {
        service.createSoloRoom(gameOptions, botLevel);

        const roomInfo: RoomInfo = { roomId: 'room-id', gameOptions };
        socketService.peerSideEmit('create solo room success', roomInfo);

        const expectedAction = cold('a', { a: createRoomSuccess({ roomInfo }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should send a switch solo room request to socket and wait for the answer', () => {
        const sendSpy = spyOn(socketService, 'emit');
        const onSpy = spyOn(socketService, 'on');

        service.switchToSoloRoom(botLevel);

        expect(sendSpy).toHaveBeenCalledWith('switch to solo room', { botLevel });
        expect(onSpy).toHaveBeenCalled();
    });

    it('should dispatch "[Room] Create Room Success" for the create room success', () => {
        service.switchToSoloRoom(botLevel);

        const roomInfo: RoomInfo = { roomId: 'room-id', gameOptions };
        socketService.peerSideEmit('switched to solo', roomInfo);

        const expectedAction = cold('a', { a: createRoomSuccess({ roomInfo }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Room] Join Invite Received" when receiving invites', () => {
        const newPlayerName = 'Player 2';
        service.waitForInvitations();

        socketService.peerSideEmit('player joining', newPlayerName);

        const expectedAction = cold('a', { a: joinInviteReceived({ playerName: newPlayerName }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Room] Join Invite Canceled" when receiving invite cancellation', () => {
        service.waitForInvitations();

        socketService.peerSideEmit('player joining cancel');

        const expectedAction = cold('a', { a: joinInviteCanceled() });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should send refuse', () => {
        const sendSpy = spyOn(socketService, 'emit');
        service.refuseInvite();
        expect(sendSpy).toHaveBeenCalledWith('refuse');
    });

    it('should send accept', () => {
        const sendSpy = spyOn(socketService, 'emit');
        service.acceptInvite();
        expect(sendSpy).toHaveBeenCalledWith('accept');
    });

    it('should send quit', () => {
        const sendSpy = spyOn(socketService, 'emit');
        service.closeRoom();
        expect(sendSpy).toHaveBeenCalledWith('quit');
    });

    it('should send cancel join room', () => {
        const sendSpy = spyOn(socketService, 'emit');
        service.cancelJoinRoom();
        expect(sendSpy).toHaveBeenCalledWith('cancel join room');
    });

    it('should request the room list and wait for an answer', () => {
        const sendSpy = spyOn(socketService, 'emit');
        const onSpy = spyOn(socketService, 'on');

        service.fetchRoomList();

        expect(sendSpy).toHaveBeenCalledWith('request list');
        expect(onSpy).toHaveBeenCalled();
    });

    describe('Room events', () => {
        const roomList: RoomInfo[] = [new RoomInfo('room-id', gameOptions)];
        const playerName = 'player 2';
        it('should dispatch "[Room] Load Rooms Success" for the create room success and wait for invitations', () => {
            service.fetchRoomList();
            socketService.peerSideEmit('get list', roomList);

            const expectedAction = cold('a', { a: loadRoomsSuccess({ rooms: roomList }) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
        });

        it('should send a request to join a room and wait for an answer', () => {
            const sendSpy = spyOn(socketService, 'emit');
            const onSpy = spyOn(socketService, 'on');

            service.joinRoom(roomList[0], playerName);

            expect(sendSpy).toHaveBeenCalledWith('join room', { roomId: roomList[0].roomId, playerName });
            expect(onSpy).toHaveBeenCalledTimes(3);
        });

        it('should send a request to join a room and wait for an answer', () => {
            const sendSpy = spyOn(socketService, 'emit');
            const onSpy = spyOn(socketService, 'on');

            service.joinRoom(roomList[0], playerName);

            expect(sendSpy).toHaveBeenCalledWith('join room', { roomId: roomList[0].roomId, playerName });
            expect(onSpy).toHaveBeenCalledTimes(3);
        });

        it('should dispatch "[Room] Join Room Accepted" when receiving accept', () => {
            service.joinRoom(roomList[0], playerName);

            socketService.peerSideEmit('accepted');

            const expectedAction = cold('a', { a: joinRoomAccepted({ roomInfo: roomList[0], playerName }) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
        });

        it('should dispatch "[Room] Join Room Declined" when receiving accept', () => {
            service.joinRoom(roomList[0], playerName);

            socketService.peerSideEmit('refused');

            const expectedAction = cold('a', { a: joinRoomDeclined({ roomInfo: roomList[0], playerName }) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
        });

        it('should dispatch "[Room] Join Invite Canceled" when the dictionaryName is the one used', () => {
            service.joinRoom(roomList[0], playerName);

            socketService.peerSideEmit('dictionary deleted', 'dict');

            const expectedAction = cold('a', { a: joinInviteCanceled() });
            expect(store.scannedActions$).toBeObservable(expectedAction);
        });

        it('should not dispatch "[Room] Join Invite Canceled" when the dictionaryName is not the one used', () => {
            const dispatchSpy = spyOn(store, 'dispatch');
            service.joinRoom(roomList[0], playerName);

            socketService.peerSideEmit('dictionary deleted', 'other dict');

            expect(dispatchSpy).not.toHaveBeenCalled();
        });
    });
});
