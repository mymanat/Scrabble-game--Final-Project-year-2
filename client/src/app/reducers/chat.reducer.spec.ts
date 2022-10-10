import * as chatAction from '@app/actions/chat.actions';
import { resetAllState } from '@app/actions/game-status.actions';
import { ChatMessage } from '@app/interfaces/chat-message';
import { initialState, reducer } from '@app/reducers/chat.reducer';
describe('[Chat] Received message', () => {
    const chatMessageStub: ChatMessage = {
        username: 'Brian',
        message: 'is in the kitchen',
        messageType: 'Error',
    };
    it('should write message in last messages when message written', () => {
        const action = chatAction.messageWritten(chatMessageStub);

        const result = reducer(initialState, action);

        expect(result.lastSendMessage).toEqual([chatMessageStub.message]);
        expect(result.lastSendMessage).not.toBe([chatMessageStub.message]);
    });

    it('should receive the message', () => {
        const action = chatAction.receivedMessage(chatMessageStub);

        const result = reducer(initialState, action);

        expect(result.chatMessage).toEqual([chatMessageStub]);
        expect(result.chatMessage).not.toBe([chatMessageStub]);
    });

    it('should add the old messages', () => {
        const action = chatAction.restoreMessages({ oldMessages: [chatMessageStub] });
        const result = reducer(initialState, action);

        expect(result.chatMessage).toEqual([chatMessageStub]);
        expect(result.chatMessage).not.toBe([chatMessageStub]);
    });

    it('should reset to initial state', () => {
        const action = resetAllState();
        const result = reducer({ chatMessage: [chatMessageStub], lastSendMessage: [] }, action);

        expect(result.chatMessage).toEqual([]);
    });
});
