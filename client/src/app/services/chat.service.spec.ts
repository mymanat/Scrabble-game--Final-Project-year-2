/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { TestBed } from '@angular/core/testing';
import { receivedMessage } from '@app/actions/chat.actions';
import { refreshObjectiveState } from '@app/actions/game-objective.actions';
import { getGameStatus } from '@app/actions/game-status.actions';
import { exchangeLetters, placeWord } from '@app/actions/player.actions';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { ChatMessage } from '@app/interfaces/chat-message';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { Socket } from 'socket.io-client';
import { ChatService } from './chat.service';
import { SocketClientService } from './socket-client.service';

describe('ChatService', () => {
    let service: ChatService;
    let store: MockStore;
    let username: string;
    let socketHelper: SocketTestHelper;
    const RESPONSE_TIME = 200;
    beforeEach(async () => {
        username = 'My name';
        socketHelper = new SocketTestHelper();
        await TestBed.configureTestingModule({
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'gameStatus',
                            value: { activePlayer: username, letterPotLength: 9, gameEnded: false },
                        },
                    ],
                }),
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketHelper,
                        send: (value: string) => {
                            socketHelper.emit(value);
                            return;
                        },
                        on: (event: string, callback: () => void) => {
                            socketHelper.on(event, callback);
                            return;
                        },
                    },
                },
            ],
        }).compileComponents();
        service = TestBed.inject(ChatService);
        store = TestBed.inject(MockStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('broadcastMsg should emit send message with the username and message', (done) => {
        const sendSpy = spyOn(service['socketService'], 'send');
        const expectedMessage = { username: 'My Name', message: 'Coucou', messageType: '' };
        service.broadcastMsg(expectedMessage.username, expectedMessage.message);
        setTimeout(() => {
            expect(sendSpy).toHaveBeenCalledOnceWith('send message', expectedMessage);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive log2990 objectives and dispatch "[Game Objective] Refresh Objective State"', (done) => {
        const expectedObjectives = { publicObjectives: [], privateObjectives: [] };
        service.acceptNewAction();
        socketHelper.peerSideEmit('log2990 objectives', expectedObjectives);
        setTimeout(() => {
            const expectedAction = cold('a', { a: refreshObjectiveState(expectedObjectives) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive message and dispatch "[Chat] Received message"', (done) => {
        const expectedMessage: ChatMessage = { username, message: 'Hello World', messageType: '' };
        service.acceptNewAction();
        socketHelper.peerSideEmit('receive message', expectedMessage);
        setTimeout(() => {
            const expectedAction = cold('a', { a: receivedMessage(expectedMessage) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive place success and dispatch "[Chat] Received message"', (done) => {
        const expectedMessage: ChatMessage = { username, message: '!placer h8v tres', messageType: '' };
        service.acceptNewAction();
        socketHelper.peerSideEmit('place success', { args: ['h8v', 'tres'], username });
        setTimeout(() => {
            const expectedAction = cold('a', { a: receivedMessage(expectedMessage) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive draw success and dispatch "[Chat] Received message"', (done) => {
        const expectedMessage: ChatMessage = { username, message: '!échanger tres', messageType: '' };
        service.acceptNewAction();
        socketHelper.peerSideEmit('draw success', { letters: 'tres', username });
        setTimeout(() => {
            const expectedAction = cold('a', { a: receivedMessage(expectedMessage) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive skip success and dispatch "[Chat] Received message"', (done) => {
        const expectedMessage: ChatMessage = { username, message: '!passer', messageType: '' };
        service.acceptNewAction();
        socketHelper.peerSideEmit('skip success', username);
        setTimeout(() => {
            const expectedAction = cold('a', { a: receivedMessage(expectedMessage) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive hint when less than 3 results success and dispatch "[Chat] Received message"', (done) => {
        const message = ['!placer h8h ear', '!placer h3v pla'];
        const expectedMessage: ChatMessage = { username: '', message: '2 indices trouvés\n!placer h8h ear\n!placer h3v pla', messageType: 'System' };
        service.acceptNewAction();
        socketHelper.peerSideEmit('hint success', { hints: message });
        setTimeout(() => {
            const expectedAction = cold('a', { a: receivedMessage(expectedMessage) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive hint success and dispatch "[Chat] Received message"', (done) => {
        const message = ['!placer h8h ear', '!placer h3v pla', '!placer h3h abc'];
        const expectedMessage: ChatMessage = { username: '', message: '!placer h8h ear\n!placer h3v pla\n!placer h3h abc', messageType: 'System' };
        service.acceptNewAction();
        socketHelper.peerSideEmit('hint success', { hints: message });
        setTimeout(() => {
            const expectedAction = cold('a', { a: receivedMessage(expectedMessage) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive turn ended and dispatch "[Game Status] Get Game"', (done) => {
        service.acceptNewAction();
        socketHelper.peerSideEmit('turn ended');
        setTimeout(() => {
            const expectedAction = cold('a', { a: getGameStatus() });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive error and dispatch "[Game Status] Get Game" if it is not a invalid word error', (done) => {
        const errorMessage = 'Bad command';
        service.acceptNewAction();
        socketHelper.peerSideEmit('error', errorMessage);
        setTimeout(() => {
            const expectedAction = cold('a', { a: getGameStatus() });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('acceptNewAction should be able to receive error and dispatch "[Chat] Received message" and not "[Game Status] Get Game"', (done) => {
        const errorMessage = 'Ce placement crée un mot invalide';
        const expectedMessage = { username: '', message: errorMessage, messageType: 'Error' };
        service.acceptNewAction();
        socketHelper.peerSideEmit('error', errorMessage);
        const dispatchSpy = spyOn(service['store'], 'dispatch');
        setTimeout(() => {
            const expectedAction = cold('a', { a: receivedMessage(expectedMessage) });
            expect(store.scannedActions$).toBeObservable(expectedAction);
            expect(dispatchSpy).not.toHaveBeenCalledWith(getGameStatus());
            done();
        }, RESPONSE_TIME);
    });

    it('should dispatch "[Chat] Received message" with the username and message when the message does not start by !', () => {
        const exampleMessage = 'Bonjour';
        service.messageWritten(username, exampleMessage);
        const expectedAction = cold('a', { a: receivedMessage({ username, message: exampleMessage, messageType: '' }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should call handleTurnSpecificCommands if the command is not a non turn specific command', () => {
        const handleSpecificCommandSpy = spyOn(service as any, 'handleTurnSpecificCommands');
        const exampleMessage = '!passer';
        service.messageWritten(username, exampleMessage);
        expect(handleSpecificCommandSpy).toHaveBeenCalled();
    });

    it('should not call handleTurnSpecificCommands if handleNonTurnSpecificCommands returns true', () => {
        const handleNonSpecificCommandSpy = spyOn(service as any, 'handleNonTurnSpecificCommands').and.callFake(() => true);
        const handleSpecificCommandSpy = spyOn(service as any, 'handleTurnSpecificCommands');
        const exampleMessage = '!réserve';
        service.messageWritten(username, exampleMessage);
        expect(handleNonSpecificCommandSpy).toHaveBeenCalled();
        expect(handleSpecificCommandSpy).not.toHaveBeenCalled();
    });

    it('should dispatch "[Chat] Received message" with an Error if the command does not exist', () => {
        const exampleMessage = ['!Bonjour'];
        service['handleTurnSpecificCommands'](exampleMessage);
        const expectedAction = cold('a', {
            a: receivedMessage({ username: '', message: 'Entrée invalide', messageType: 'Error' }),
        });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Chat] Received message" with a syntax Error if the command passer is not valid', () => {
        const exampleMessage = ['!passer', 'z4,e'];
        service['handleTurnSpecificCommands'](exampleMessage);
        const expectedAction = cold('a', {
            a: receivedMessage({ username: '', message: 'Erreur de syntaxe - commande passer mal formée', messageType: 'Error' }),
        });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Chat] Received message" with a turn Error if the activePlayer is not the player typing the command', () => {
        const exampleMessage = '!passer';
        const otherPlayer = 'Other Player';
        service.messageWritten(otherPlayer, exampleMessage);
        const expectedAction = cold('a', {
            a: receivedMessage({ username: '', message: "Commande impossible à réaliser - Ce n'est pas votre tour", messageType: 'Error' }),
        });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Chat] Received message" with a syntax Error if the command placer is not valid', () => {
        const exampleMessage = ['!placer', 'nfpe', 'z4,e'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(service as any, 'validatePlaceCommand').and.callFake(() => false);
        service['handlePlaceCommand'](exampleMessage);
        const expectedAction = cold('a', {
            a: receivedMessage({ username: '', message: 'Erreur de syntaxe - commande placer mal formée', messageType: 'Error' }),
        });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Chat] Received message" with a syntax Error if the command échanger is not valid', () => {
        const exampleMessage = ['!échanger', 'n_fpe38'];
        service['handleExchangeCommand'](exampleMessage);
        const expectedAction = cold('a', {
            a: receivedMessage({ username: '', message: 'Erreur de syntaxe - commande échanger mal formée', messageType: 'Error' }),
        });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Chat] Received message" with a syntax Error if the command passer is not valid', () => {
        const exampleMessage = ['!passer', 'n_fpe38'];
        service['handleSimpleCommand'](exampleMessage);
        const expectedAction = cold('a', {
            a: receivedMessage({ username: '', message: 'Erreur de syntaxe - commande mal formée', messageType: 'Error' }),
        });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should dispatch "[Players] Place Word" when typing a valid place command', () => {
        const dispatchSpy = spyOn(service['store'], 'dispatch');
        const exampleMessage = ['!placer', 'a1h', 'abcpzoe'];
        const position = 'a1h';
        const letters = 'abcpzoe';
        service['handlePlaceCommand'](exampleMessage);
        expect(dispatchSpy).toHaveBeenCalledWith(placeWord({ position, letters }));
    });

    it('should call handlePlaceCommand with the command !placer', () => {
        const exchangeCommandSpy = spyOn(service as any, 'handlePlaceCommand');
        const exampleMessage = ['!placer', 'h7h', 'aer'];
        service['handleTurnSpecificCommands'](exampleMessage);
        expect(exchangeCommandSpy).toHaveBeenCalledWith(exampleMessage);
    });

    it('should call handleExchangeCommand with the command !échanger', () => {
        const exchangeCommandSpy = spyOn(service as any, 'handleExchangeCommand');
        const exampleMessage = ['!échanger', 'aer'];
        service['handleTurnSpecificCommands'](exampleMessage);
        expect(exchangeCommandSpy).toHaveBeenCalledWith(exampleMessage);
    });

    it('should call handleSimpleCommand with the command !indice', () => {
        const exchangeCommandSpy = spyOn(service as any, 'handleSimpleCommand');
        const exampleMessage = ['!indice'];
        service['handleTurnSpecificCommands'](exampleMessage);
        expect(exchangeCommandSpy).toHaveBeenCalledWith(exampleMessage);
    });

    it('should call handleSimpleCommand with the command to skip if the command is valid', () => {
        const exchangeCommandSpy = spyOn(service as any, 'handleSimpleCommand');
        const exampleMessage = ['!passer'];
        service['handleTurnSpecificCommands'](exampleMessage);
        expect(exchangeCommandSpy).toHaveBeenCalledWith(exampleMessage);
    });

    it('should call handleExchangeCommand with the command to exchange if the command is valid', () => {
        const dispatchSpy = spyOn(service['store'], 'dispatch');
        const exampleMessage = ['!échanger', 'aerev'];
        service['handleExchangeCommand'](exampleMessage);
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeLetters({ letters: 'aerev' }));
    });

    it('handleSimpleCommand should call socketService send with namespace command', () => {
        const exampleCommand = ['!passer'];
        const sendSpy = spyOn(service['socketService'], 'send');
        service['handleSimpleCommand'](exampleCommand);
        expect(sendSpy).toHaveBeenCalledOnceWith('command', 'passer');
    });

    it('validatePlaceCommand should return true when the command is properly called', () => {
        const exampleCommand = ['!placer', 'a1h', 'abcpzoNe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeTrue();
    });

    it('validatePlaceCommand should return false when the word extends the column size', () => {
        const exampleCommand = ['!placer', 'a11h', 'abcpzoe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false when the word extends the line size', () => {
        const exampleCommand = ['!placer', 'm11v', 'abcpzoe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false when there are more than 3 parts to the command', () => {
        const exampleCommand = ['!placer', 'a11h', 'abcpzoe', 'last part'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false when the line letter is not from a to o', () => {
        const exampleCommand = ['!placer', 'v11h', 'abcpzoe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false when the direction char is not h or v', () => {
        const exampleCommand = ['!placer', 'a11i', 'abcpzoe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false when the last part is not only letters', () => {
        const exampleCommand = ['!placer', 'a11h', 'a_cp8oe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return true if there is no direction letter but only 1 letter is placed', () => {
        const exampleCommand = ['!placer', 'a11', 'a'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeTrue();
    });

    it('validatePlaceCommand should return false if the number is greater than 15', () => {
        const exampleCommand = ['!placer', 'a16v', 'abcpzoe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false if there is not only letters and numbers in the second part', () => {
        const exampleCommand = ['!placer', 'a1.6v_', 'abcpzoe'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false if the word goes out of the board horizontally', () => {
        const exampleCommand = ['!placer', 'h15h', 'abcp'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validatePlaceCommand should return false if the word goes out of the board vertically', () => {
        const exampleCommand = ['!placer', 'o5v', 'abcp'];
        expect(service['validatePlaceCommand'](exampleCommand)).toBeFalse();
    });

    it('validateExchangeCommand should return true if only letters are in the second part', () => {
        const exampleCommand = ['!échanger', 'abcpzoe'];
        expect(service['validateExchangeCommand'](exampleCommand)).toBeTrue();
    });

    it('validateExchangeCommand should return false if the second part contains anything else than letters', () => {
        const exampleCommand = ['!échanger', 'ab1pz.e'];
        expect(service['validateExchangeCommand'](exampleCommand)).toBeFalse();
    });

    it('validateExchangeCommand should return false if there is more than two parts to the command', () => {
        const exampleCommand = ['!échanger', 'abcpzoe', 'last part'];
        expect(service['validateExchangeCommand'](exampleCommand)).toBeFalse();
    });
});
describe('ChatService', () => {
    let service: ChatService;
    let store: MockStore;
    let username: string;
    let socketHelper: SocketTestHelper;
    beforeEach(async () => {
        username = 'My name';
        socketHelper = new SocketTestHelper();
        await TestBed.configureTestingModule({
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'gameStatus',
                            value: { activePlayer: username, letterPotLength: 0, gameEnded: true },
                        },
                    ],
                }),
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketHelper,
                        send: (value: string) => {
                            socketHelper.emit(value);
                            return;
                        },
                        on: (event: string, callback: () => void) => {
                            socketHelper.on(event, callback);
                            return;
                        },
                    },
                },
            ],
        }).compileComponents();
        service = TestBed.inject(ChatService);
        store = TestBed.inject(MockStore);
        service['socketService'].socket = socketHelper as unknown as Socket;
    });

    it('should dispatch "[Chat] Received message" with a turn Error if the game has ended', () => {
        const exampleMessage = '!passer';
        const otherPlayer = 'Other Player';
        service.messageWritten(otherPlayer, exampleMessage);
        const expectedAction = cold('a', { a: receivedMessage({ username: '', message: 'La partie est finie', messageType: 'Error' }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('handleNonTurnSpecificCommand should return true on correct call', () => {
        expect(service['handleNonTurnSpecificCommands'](['!réserve'])).toBeTruthy();
    });

    it('handleNonTurnSpecificCommand should return true on correct call with wrong arguments', () => {
        expect(service['handleNonTurnSpecificCommands'](['!réserve', 'a'])).toBeTruthy();
    });

    it('handleNonTurnSpecificCommand should return true on correct call', () => {
        expect(service['handleNonTurnSpecificCommands'](['!aide'])).toBeTruthy();
    });

    it('handleNonTurnSpecificCommand should return true on correct call with wrong arguments', () => {
        expect(service['handleNonTurnSpecificCommands'](['!aide', 'a'])).toBeTruthy();
    });

    it('should call helpProcess with the command !aide', () => {
        const helpCommandSpy = spyOn(service as any, 'processHelp');
        const exampleMessage = ['!aide'];
        service['handleNonTurnSpecificCommands'](exampleMessage);
        expect(helpCommandSpy).toHaveBeenCalledWith();
    });
});
