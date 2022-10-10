import { TestBed } from '@angular/core/testing';
import { loadGameHistorySuccess } from '@app/actions/game-history.actions';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { GameHistory } from 'common/interfaces/game-history';
import { GameMode } from 'common/interfaces/game-mode';
import { cold } from 'jasmine-marbles';
import { Socket } from 'socket.io-client';
import { GameHistoryService } from './game-history.service';
import { SocketClientService } from './socket-client.service';

describe('GameHistoryService', () => {
    let service: GameHistoryService;
    let socketService: SocketTestHelper;
    let store: MockStore;
    const gameHistoryMock = [
        {
            date: '01-01-2022',
            gameDuration: '0 sec',
            namePlayer1: 'Alain',
            scorePlayer1: 0,
            namePlayer2: 'Terieur',
            gameMode: GameMode.Classical,
            isSurrender: false,
        } as GameHistory,
    ];
    const RESPONSE_TIME = 200;

    beforeEach(() => {
        socketService = new SocketTestHelper();

        TestBed.configureTestingModule({
            providers: [
                provideMockStore(),
                {
                    provide: SocketClientService,
                    useValue: {
                        socket: socketService,
                        send: (value: string) => {
                            socketService.emit(value);
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
        service = TestBed.inject(GameHistoryService);
        TestBed.inject(SocketClientService).socket = TestBed.inject(SocketClientService).socket = socketService as unknown as Socket;
        store = TestBed.inject(MockStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getGameHistory should send "get gameHistory" to socket', () => {
        const emitSpy = spyOn(socketService, 'emit');
        service.getGameHistory();
        expect(emitSpy).toHaveBeenCalledWith('get gameHistory');
    });

    it('getGameHistory should dispatch loadGameHistorySuccess when receive  gameHistory is called', (done) => {
        service.getGameHistory();
        socketService.peerSideEmit('receive gameHistory', gameHistoryMock);
        const expectedAction = cold('a', { a: loadGameHistorySuccess({ gameHistory: gameHistoryMock }) });
        setTimeout(() => {
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('resetGameHistory should send reset gameHistory', (done) => {
        spyOn(socketService, 'emit').and.callFake((value: string) => {
            expect(value).toEqual('reset gameHistory');
            done();
        });
        service.resetGameHistory();
    });
});
