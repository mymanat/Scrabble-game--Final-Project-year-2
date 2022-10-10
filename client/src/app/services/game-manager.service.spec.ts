import { TestBed } from '@angular/core/testing';
import { endGame, gameStatusReceived } from '@app/actions/game-status.actions';
import { BoardSelection } from '@app/classes/board-selection';
import { Player } from '@app/classes/player';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import { BoardState } from '@app/reducers/board.reducer';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Players } from '@app/reducers/player.reducer';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { Socket } from 'socket.io-client';
import { GameManagerService } from './game-manager.service';
import { SocketClientService } from './socket-client.service';

describe('GameManagerService', () => {
    const players: Players = {
        player: new Player('Player 1'),
        opponent: new Player('Player 2'),
    };
    const gameStatus: GameStatus = {
        activePlayer: '',
        winner: null,
        gameEnded: false,
        letterPotLength: 10,
        timer: 0,
    };
    const boardState: BoardState = {
        board: [],
        multipliers: [],
        pointsPerLetter: new Map(),
        blanks: [],
        lastPlacedWord: [],
        selection: new BoardSelection(),
    };
    const status = { status: gameStatus, players, board: boardState };

    let service: GameManagerService;
    let socketService: SocketTestHelper;
    let store: MockStore;

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
        TestBed.inject(SocketClientService).socket = socketService as unknown as Socket;
        TestBed.compileComponents();
        service = TestBed.inject(GameManagerService);
        store = TestBed.inject(MockStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should dispatch "[Game Status] End Game" when an end game call is received', () => {
        const endGameStatus = { players, remainingLetters: 0, winner: 'player 1' };

        service.getGameStatus();

        socketService.peerSideEmit('end game', endGameStatus);

        const expectedAction = cold('a', { a: endGame(endGameStatus) });

        expect(store.scannedActions$).toBeObservable(expectedAction);
    });

    it('should send "get game status" to the socket', () => {
        const sendSpy = spyOn(socketService, 'emit');

        service.getGameStatus();

        expect(sendSpy).toHaveBeenCalledWith('get game status');
    });

    it('should dispatch "[Game Status] Game Status Received" when receive game status from socket', () => {
        service.getGameStatus();
        socketService.peerSideEmit('game status', status);

        const expectedAction = cold('a', { a: gameStatusReceived(status) });
        expect(store.scannedActions$).toBeObservable(expectedAction);
    });
});
