import * as chatActions from '@app/actions/chat.actions';
import { resetAllState } from '@app/actions/game-status.actions';
import { ChatMessage } from '@app/interfaces/chat-message';
import { createReducer, on } from '@ngrx/store';

export interface ChatBox {
    chatMessage: ChatMessage[];
    lastSendMessage: string[];
}

export const chatFeatureKey = 'chat';

export const initialState: ChatBox = { chatMessage: [], lastSendMessage: [] };

export const reducer = createReducer(
    initialState,
    on(chatActions.messageWritten, (state, { message }) => {
        const lastMessage = [...state.lastSendMessage];
        lastMessage.push(message);
        return { ...state, lastSendMessage: lastMessage };
    }),
    on(chatActions.receivedMessage, (state, { username, message, messageType }) => {
        const messages = [...state.chatMessage];
        const newMessages = message.split('\n').map((msg) => ({ username, message: msg, messageType }));
        messages.push(...newMessages);
        return { ...state, chatMessage: messages };
    }),
    on(chatActions.restoreMessages, (state, { oldMessages }) => ({ ...state, chatMessage: oldMessages })),
    on(resetAllState, () => initialState),
);
