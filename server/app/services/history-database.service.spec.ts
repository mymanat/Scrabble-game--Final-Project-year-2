/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
import { PORT } from '@app/environnement';
import { HistoryDatabaseService } from '@app/services/history-database.service';
import { fail } from 'assert';
import { expect } from 'chai';
import { GameHistory } from 'common/interfaces/game-history';
import { GameMode } from 'common/interfaces/game-mode';
import { createServer, Server } from 'http';
import { describe } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { restore, stub } from 'sinon';
import io from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';

describe('History-database service', () => {
    let databaseService: HistoryDatabaseService;
    let mongoServer: MongoMemoryServer;

    const gameHistoryMock = {
        date: '2022-01-01',
        gameDuration: '0 sec',
        namePlayer1: 'Alain',
        scorePlayer1: 0,
        namePlayer2: 'Terieur',
        scorePlayer2: 0,
        gameMode: GameMode.Classical,
        isSurrender: false,
    } as GameHistory;
    beforeEach(async () => {
        databaseService = new HistoryDatabaseService();
        mongoServer = await MongoMemoryServer.create();
    });

    afterEach(async () => {
        if (databaseService['client']) {
            await databaseService['client'].close();
        }
        restore();
    });

    it('should connect to the database when start is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        expect(databaseService['client']).to.not.be.undefined;
    });

    it('should not connect to the database when databaseConnect is called with the wrong URL', async () => {
        try {
            await databaseService.start('WRONG_URL');
            fail();
        } catch {
            expect(databaseService['client']).to.be.undefined;
        }
    });

    it('should no longer be connected if close is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.closeConnection();
        expect(databaseService['client']).to.not.be.undefined;
    });

    it('if no data is in the database, it should return a length of 0', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        const gameHistory = await databaseService.getGameHistory();
        expect(gameHistory.length).to.equal(0);
    });

    it('should getGameHistory when a game is added in the database', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.addGameHistory(gameHistoryMock);
        const gameHistory = await databaseService.getGameHistory();
        expect(gameHistory[0].date).to.eq('2022-01-01');
        expect(gameHistory[0].gameDuration).to.eq('0 sec');
        expect(gameHistory[0].namePlayer1).to.eq('Alain');
        expect(gameHistory[0].scorePlayer1).to.eq(0);
        expect(gameHistory[0].namePlayer2).to.eq('Terieur');
        expect(gameHistory[0].scorePlayer2).to.eq(0);
        expect(gameHistory[0].gameMode).to.eq('Classique');
        expect(gameHistory[0].isSurrender).to.eq(false);
    });

    it('should reset the database when calling resetDB', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.addGameHistory(gameHistoryMock);
        await databaseService.resetDB();
        const gameHistory = await databaseService.getGameHistory();
        expect(gameHistory).to.be.empty;
    });

    describe('socket connections', () => {
        let hostSocket: Socket;
        let server: io.Server;
        let httpServer: Server;

        before((done) => {
            httpServer = createServer();
            httpServer.listen(PORT);
            server = new io.Server(httpServer);
            httpServer.on('listening', () => done());
        });

        beforeEach(() => {
            hostSocket = Client('http://localhost:3000');
        });

        afterEach(() => {
            server.removeAllListeners();
            hostSocket.removeAllListeners();
        });

        after(() => {
            server.close();
            httpServer.close();
        });

        it('should emit receive gameHistory when receiving get gameHistory', (done) => {
            let gameHistoryReceived = false;
            stub(databaseService, 'getGameHistory').resolves([gameHistoryMock]);
            server.on('connection', (socket) => {
                databaseService.setupSocketConnection(socket);
                hostSocket.emit('get gameHistory');
                hostSocket.once('receive gameHistory', () => {
                    gameHistoryReceived = true;
                });
            });
            const responseDelay = 200;
            setTimeout(() => {
                expect(gameHistoryReceived).to.equal(true);
                done();
            }, responseDelay);
        });

        it('should call resetDB and getGameHistory when reset gameHistory received', (done) => {
            const resetStub = stub(databaseService, 'resetDB').resolves(undefined);
            const gameHistoryStub = stub(databaseService, 'getGameHistory').resolves([gameHistoryMock]);
            server.on('connection', (socket) => {
                databaseService.setupSocketConnection(socket);
                hostSocket.emit('reset gameHistory');
            });
            const responseDelay = 200;
            setTimeout(() => {
                expect(resetStub.called).to.equal(true);
                expect(gameHistoryStub.called).to.equal(true);
                done();
            }, responseDelay);
        });
    });
});
