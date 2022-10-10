import { TestBed } from '@angular/core/testing';
import { loadClassicLeaderboardSuccess, loadLog2990LeaderboardSuccess } from '@app/actions/leaderboard.actions';
import { HighScore } from '@app/classes/highscore';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { Socket } from 'socket.io-client';
import { LeaderboardService } from './leaderboard.service';
import { SocketClientService } from './socket-client.service';

describe('LeaderBoardService', () => {
    let service: LeaderboardService;
    let socketService: SocketTestHelper;
    let store: MockStore;
    const highScoreExemple = [{ name: 'name1', score: 0 }] as HighScore[];
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
        service = TestBed.inject(LeaderboardService);
        TestBed.inject(SocketClientService).socket = TestBed.inject(SocketClientService).socket = socketService as unknown as Socket;
        store = TestBed.inject(MockStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getLeaderboard should send "get highscores" to socket', () => {
        const emitSpy = spyOn(socketService, 'emit');
        service.getLeaderboard();
        expect(emitSpy).toHaveBeenCalledWith('get highScores');
    });

    it('getLeaderboard should dispatch loadClassicLeaderboardSuccess when receive classic highscores is called', (done) => {
        service.getLeaderboard();
        socketService.peerSideEmit('receive classic highscores', highScoreExemple);
        const expectedAction = cold('a', { a: loadClassicLeaderboardSuccess({ highScores: highScoreExemple }) });
        setTimeout(() => {
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('getLeaderboard should dispatch loadLog2990LeaderboardSuccess when receive log2990 highscores is called', (done) => {
        service.getLeaderboard();
        socketService.peerSideEmit('receive log2990 highscores', highScoreExemple);
        const expectedAction = cold('a', { a: loadLog2990LeaderboardSuccess({ highScores: highScoreExemple }) });
        setTimeout(() => {
            expect(store.scannedActions$).toBeObservable(expectedAction);
            done();
        }, RESPONSE_TIME);
    });

    it('resetLeaderboard should send "reset highScores" to socket', () => {
        const emitSpy = spyOn(socketService, 'emit');
        service.resetLeaderboard();
        expect(emitSpy).toHaveBeenCalledWith('reset highScores');
    });
});
