/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript

import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
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
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
@Injectable()
export class RoomEffects {
    createRoomEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(createRoom),
                tap((action) => {
                    this.roomService.createRoom(action.gameOptions);
                }),
            ),
        { dispatch: false },
    );

    createSoloRoomEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(createSoloRoom),
                tap((action) => {
                    this.roomService.createSoloRoom(action.gameOptions, action.botLevel);
                }),
            ),
        { dispatch: false },
    );

    switchToSoloRoomEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(switchToSoloRoom),
                tap((action) => {
                    this.roomService.switchToSoloRoom(action.botLevel);
                }),
            ),
        { dispatch: false },
    );

    closeRoomEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(closeRoom),
                tap(() => {
                    this.roomService.closeRoom();
                    if (this.roomCreationStepper) this.roomCreationStepper.reset();
                }),
            ),
        { dispatch: false },
    );

    refuseInviteEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(refuseInvite),
                tap(() => {
                    this.roomService.refuseInvite();
                }),
            ),
        { dispatch: false },
    );

    acceptInviteEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(acceptInvite),
                tap(() => {
                    this.roomService.acceptInvite();
                }),
            ),
        { dispatch: false },
    );

    loadRoomsEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(loadRooms),
                tap(() => {
                    this.roomService.fetchRoomList();
                }),
            ),
        { dispatch: false },
    );

    joinRoomEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(joinRoom),
                tap((action) => {
                    this.roomService.joinRoom(action.roomInfo, action.playerName);
                }),
            ),
        { dispatch: false },
    );

    acceptedRoomEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(joinRoomAccepted),
                tap(() => {
                    this.router.navigateByUrl('game');
                    this.dialogRef.close();
                }),
            ),
        { dispatch: false },
    );

    cancelJoinRoomEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(cancelJoinRoom),
                tap(() => {
                    this.roomService.cancelJoinRoom();
                }),
            ),
        { dispatch: false },
    );

    dialogRef: MatDialogRef<GameJoinPageComponent>;
    roomCreationStepper: MatStepper;

    constructor(private actions$: Actions, private roomService: RoomService, private router: Router) {}
}
