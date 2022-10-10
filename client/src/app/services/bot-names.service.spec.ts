/* eslint-disable dot-notation */
import { TestBed } from '@angular/core/testing';
import { loadBotNamesSuccess } from '@app/actions/bot-names.actions';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { BotNamesService } from './bot-names.service';
import { SocketClientService } from './socket-client.service';

describe('BotNamesService', () => {
    let service: BotNamesService;
    let socketHelperService: SocketTestHelper;
    let store: MockStore;

    beforeEach(async () => {
        socketHelperService = new SocketTestHelper();
        await TestBed.configureTestingModule({
            providers: [
                provideMockStore(),
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketHelperService,
                        send: (value: string) => {
                            socketHelperService.emit(value);
                            return;
                        },
                        on: (event: string, callback: () => void) => {
                            socketHelperService.on(event, callback);
                            return;
                        },
                    },
                },
            ],
        }).compileComponents();
        service = TestBed.inject(BotNamesService);
        store = TestBed.inject(MockStore);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('getBotNames should send get bot names and call on for receive bot name', () => {
        const expectedNames = { hard: ['MIKE'], easy: ['BOB'] };
        const sendSpy = spyOn(service['socketService'], 'send');
        const onSpy = spyOn(service['socketService'], 'on').and.callThrough();
        service.getBotNames();
        socketHelperService.peerSideEmit('receive bot name', expectedNames);
        const expectedAction = cold('a', { a: loadBotNamesSuccess({ names: expectedNames }) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
        expect(sendSpy).toHaveBeenCalledWith('get bot names');
        expect(onSpy).toHaveBeenCalled();
    });

    it('addBotName should send add bot name with given parameters', () => {
        const expectedName = 'MIKE';
        const expectedDifficulty = 'Débutant';
        const sendSpy = spyOn(service['socketService'], 'send');
        service.addBotName(expectedName, expectedDifficulty);
        expect(sendSpy).toHaveBeenCalledWith('add bot name', { name: expectedName, difficulty: expectedDifficulty });
    });

    it('deleteBotName should send delete bot name with given parameters', () => {
        const expectedName = 'MIKE';
        const expectedDifficulty = 'Débutant';
        const sendSpy = spyOn(service['socketService'], 'send');
        service.deleteBotName(expectedName, expectedDifficulty);
        expect(sendSpy).toHaveBeenCalledWith('delete bot name', { name: expectedName, difficulty: expectedDifficulty });
    });

    it('modifyBotName should send modify bot name with given parameters', () => {
        const expectedName = 'MIKE';
        const expectedOldName = 'Débutant';
        const sendSpy = spyOn(service['socketService'], 'send');
        service.modifyBotName(expectedOldName, expectedName);
        expect(sendSpy).toHaveBeenCalledWith('modify bot name', { previousName: expectedOldName, modifiedName: expectedName });
    });

    it('resetBotNames should send reset all names', () => {
        const sendSpy = spyOn(service['socketService'], 'send');
        service.resetBotNames();
        expect(sendSpy).toHaveBeenCalledWith('reset all names');
    });
});
