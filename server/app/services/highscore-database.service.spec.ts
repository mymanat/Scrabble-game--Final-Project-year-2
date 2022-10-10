/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
import { HIGHSCORE_DATABASE } from '@app/classes/highscore';
import { PORT } from '@app/environnement';
import { HighscoreDatabaseService } from '@app/services/highscore-database.service';
import { fail } from 'assert';
import { expect } from 'chai';
import { GameMode } from 'common/interfaces/game-mode';
import { createServer, Server } from 'http';
import { describe } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { stub } from 'sinon';
import io from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';

describe('Highscore-database service', () => {
    let databaseService: HighscoreDatabaseService;
    let mongoServer: MongoMemoryServer;
    const player1 = { name: 'fakePlayer1', score: 10 };
    const player2 = { name: 'fakePlayer2', score: -1 };
    const player3 = { name: 'fakePlayer3', score: 10 };

    beforeEach(async () => {
        databaseService = new HighscoreDatabaseService();
        mongoServer = await MongoMemoryServer.create();
    });

    afterEach(async () => {
        if (databaseService['client']) {
            await databaseService['client'].close();
        }
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

    it('should populate the database when start is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        const scores = await databaseService.database.collection(HIGHSCORE_DATABASE.highScore.collections.classical).find({}).toArray();
        expect(scores.length).to.equal(5);
    });

    it('should not populate the database with start function if it is already populated', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        let scores = await databaseService.database.collection(HIGHSCORE_DATABASE.highScore.collections.classical).find({}).toArray();
        expect(scores.length).to.equal(5);
        await databaseService.closeConnection();
        await databaseService.start(mongoUri);
        scores = await databaseService.database.collection(HIGHSCORE_DATABASE.highScore.collections.classical).find({}).toArray();
        expect(scores.length).to.equal(5);
    });

    it('should insert default scores in the database', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        const scoreClassic = await databaseService.getHighscores(GameMode.Classical);
        const scoreLog2990 = await databaseService.getHighscores(GameMode.Log2990);
        expect(scoreClassic.length).to.equal(5);
        expect(scoreLog2990.length).to.equal(5);
    });

    it('should return the right highscore list when connecting to the database', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        const scoreClassical = await databaseService.getHighscores(GameMode.Classical);
        expect(scoreClassical[0].name).to.equal('name5');
        expect(scoreClassical[1].name).to.equal('name4');
        expect(scoreClassical[2].name).to.equal('name3');
        expect(scoreClassical[3].name).to.equal('name2');
        expect(scoreClassical[4].name).to.equal('name1');
    });

    it('should updateHighScore when a higher score has been reached in Classical', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.updateHighScore(player1, GameMode.Classical);
        const scoreClassic = await databaseService.getHighscores(GameMode.Classical);
        expect(scoreClassic[0].name).to.equal('fakePlayer1');
        expect(scoreClassic[0].score).to.equal(10);
    });

    it('should updateHighScore when a higher score has been reached in Log2990', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.updateHighScore(player1, GameMode.Log2990);
        const scoreLog2990 = await databaseService.getHighscores(GameMode.Log2990);
        expect(scoreLog2990[0].name).to.equal('fakePlayer1');
        expect(scoreLog2990[0].score).to.equal(10);
    });

    it('should present both names when more than a player have the same score in Log2990 highscores', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.updateHighScore(player3, GameMode.Log2990);
        await databaseService.updateHighScore(player1, GameMode.Log2990);
        const scoreClassic = await databaseService.getHighscores(GameMode.Log2990);
        expect(scoreClassic[0].name).to.equal('fakePlayer3 - fakePlayer1');
    });

    it('should present both names when more than a player have the same score in Classical highscores', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.updateHighScore(player3, GameMode.Classical);
        await databaseService.updateHighScore(player3, GameMode.Classical);
        const scoreClassic = await databaseService.getHighscores(GameMode.Classical);
        expect(scoreClassic[0].name).to.equal('fakePlayer3');
    });

    it('should not updateHighScore when a new score is lower than all of the current highscores in Classical', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.updateHighScore(player2, GameMode.Classical);
        const scoreClassic = await databaseService.getHighscores(GameMode.Classical);
        for (const score of scoreClassic) {
            expect(score.name).to.not.equal('fakePlayer2');
        }
    });

    it('should reset the database when calling resetDB and call populateDB for both gameModes', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const populateClassicalStub = stub(databaseService as any, 'populateDBClassical');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const populateLog2990Stub = stub(databaseService as any, 'populateDBlog2990');
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        await databaseService.resetDB();
        const scoreClassic = await databaseService.getHighscores(GameMode.Classical);
        expect(scoreClassic).to.be.empty;
        expect(populateClassicalStub.called).to.equal(true);
        expect(populateLog2990Stub.called).to.equal(true);
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

        it('should emit receive classic highscores when receiving get highScores', (done) => {
            let classicReceived = false;
            let log2990Received = false;
            stub(databaseService, 'getHighscores').resolves([player1, player2]);
            server.on('connection', (socket) => {
                databaseService.setupSocketConnection(socket);
                hostSocket.emit('get highScores');
                hostSocket.once('receive classic highscores', () => {
                    classicReceived = true;
                });
                hostSocket.once('receive log2990 highscores', () => {
                    log2990Received = true;
                });
            });
            const responseDelay = 400;
            setTimeout(() => {
                expect(classicReceived && log2990Received).to.equal(true);
                done();
            }, responseDelay);
        });

        it('should call resetDB when reset highScores received', (done) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resetStub = stub(databaseService as any, 'resetDB');
            server.on('connection', (socket) => {
                databaseService.setupSocketConnection(socket);
                hostSocket.emit('reset highScores');
            });
            const responseDelay = 200;
            setTimeout(() => {
                expect(resetStub.called).to.equal(true);
                done();
            }, responseDelay);
        });
    });
});
