import { createAction, props } from '@ngrx/store';
import { GameOptions } from 'common/classes/game-options';
import { RoomInfo } from 'common/classes/room-info';

// Hôte
export const createRoom = createAction('[Room] Create Room', props<{ gameOptions: GameOptions }>());
export const createSoloRoom = createAction('[Room Create Solo Room', props<{ gameOptions: GameOptions; botLevel: string }>());
export const switchToSoloRoom = createAction('[Room] Switch To Solo Room', props<{ botLevel: string }>());
export const createRoomSuccess = createAction('[Room] Create Room Success', props<{ roomInfo: RoomInfo }>());
export const createRoomFailed = createAction('[Room] Create Room Failed', props<{ error: Error }>());
export const closeRoom = createAction('[Room] Close Room');

export const joinInviteReceived = createAction('[Room] Join Invite Received', props<{ playerName: string }>());
export const acceptInvite = createAction('[Room] Accept Invite');
export const refuseInvite = createAction('[Room] Refuse Invite');
export const joinInviteCanceled = createAction('[Room] Join Invite Canceled');

// Joindre
export const loadRooms = createAction('[Room] Load Rooms');
export const loadRoomsSuccess = createAction('[Room] Load Rooms Success', props<{ rooms: RoomInfo[] }>());
export const loadRoomsFailed = createAction('[Room] Load Rooms Failed', props<{ error: Error }>());

export const joinRoom = createAction('[Room] Join Room', props<{ playerName: string; roomInfo: RoomInfo }>());
export const cancelJoinRoom = createAction('[Room] Cancel Join Room', props<{ roomInfo: RoomInfo }>());
export const joinRoomAccepted = createAction('[Room] Join Room Accepted', props<{ playerName: string; roomInfo: RoomInfo }>());
export const joinRoomDeclined = createAction('[Room] Join Room Declined', props<{ playerName: string; roomInfo: RoomInfo }>());
