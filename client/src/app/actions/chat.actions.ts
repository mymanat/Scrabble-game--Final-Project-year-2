import { ChatMessage } from '@app/interfaces/chat-message';
import { createAction, props } from '@ngrx/store';

export const initiateChatting = createAction('[Chat] Initiate chatting');

export const messageWritten = createAction('[Chat] Message written', props<{ username: string; message: string; messageType?: string }>());

export const receivedMessage = createAction('[Chat] Received message', props<{ username: string; message: string; messageType: string }>());

export const restoreMessages = createAction('[Chat] Restore messages', props<{ oldMessages: ChatMessage[] }>());
