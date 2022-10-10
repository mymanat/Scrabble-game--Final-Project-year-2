import { resetAllState } from '@app/actions/game-status.actions';
import * as roomActions from '@app/actions/room.actions';
import { createReducer, on } from '@ngrx/store';
import { RoomInfo } from 'common/classes/room-info';

export const roomsFeatureKey = 'room';

export interface RoomState {
    // Pour hébergement (Hosting)
    roomInfo?: RoomInfo;
    pendingPlayer?: string;

    // Pour joindre (Joining)
    roomList: RoomInfo[];
    pendingRoom?: RoomInfo;
}

export const initialState: RoomState = {
    roomList: [],
};

export const reducer = createReducer(
    initialState,
    on(resetAllState, () => initialState),
    // Pour hébergement (Hosting)
    on(roomActions.createRoomSuccess, (state, { roomInfo }) => ({ ...state, roomInfo })),
    on(roomActions.closeRoom, () => initialState),
    on(roomActions.joinInviteReceived, (state, { playerName }) => ({ ...state, pendingPlayer: playerName })),
    on(roomActions.refuseInvite, (state) => ({ ...state, pendingPlayer: undefined })),
    on(roomActions.joinInviteCanceled, (state) => ({ ...state, pendingPlayer: undefined })),

    // Pour joindre (Joining)
    on(roomActions.loadRoomsSuccess, (state, { rooms }) => ({ ...state, roomList: rooms })),
    on(roomActions.joinRoom, (state, { roomInfo }) => ({ ...state, pendingRoom: roomInfo })),
    on(roomActions.cancelJoinRoom, (state) => ({ ...state, pendingRoom: undefined })),
    on(roomActions.joinRoomDeclined, (state) => ({ ...state, pendingRoom: undefined })),
);
