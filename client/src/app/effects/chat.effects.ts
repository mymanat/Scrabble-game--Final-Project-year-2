/* eslint-disable no-invalid-this */
// Syntaxe utilisé sur le site de ngRx
// Necessaire pour utiliser les actions dans les fichiers .effects, si on enleve la ligne esLint: unexpected this
// Si on enleve le esLint : erreur de TypeScript
import { Injectable } from '@angular/core';
import { initiateChatting, messageWritten } from '@app/actions/chat.actions';
import { ChatService } from '@app/services/chat.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

@Injectable()
export class ChatEffects {
    initiateChattingEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(initiateChatting),
                tap(() => {
                    this.chatService.acceptNewAction();
                }),
            ),
        { dispatch: false },
    );

    messageWrittenEffect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(messageWritten),
                tap((action) => {
                    this.chatService.messageWritten(action.username, action.message, action.messageType);
                }),
            ),
        { dispatch: false },
    );

    constructor(private actions$: Actions, private chatService: ChatService) {}
}
