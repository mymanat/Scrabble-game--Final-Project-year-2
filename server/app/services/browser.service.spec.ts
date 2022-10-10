/* eslint-disable dot-notation */
import { Room } from '@app/classes/room';
import { PORT, RESPONSE_DELAY } from '@app/environnement';
import { assert, expect } from 'chai';
import { createServer, Server } from 'http';
import * as sinon from 'sinon';
import { stub } from 'sinon';
import io from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { BrowserService } from './browser.service';
import { RoomsManager } from './rooms-manager.service';

describe('Browser service tests', () => {
    let service: BrowserService;
    let clientSocket: Socket;
    let server: io.Server;
    let httpServer: Server;
    let roomsManager: RoomsManager;
    const urlString = 'http://localhost:3000';

    before((done) => {
        roomsManager = Container.get(RoomsManager);
        httpServer = createServer();
        httpServer.listen(PORT);
        server = new io.Server(httpServer);
        httpServer.on('listening', () => done());
    });

    beforeEach(async () => {
        server.on('connection', (socket) => {
            service.setupSocketConnection(socket);
        });
        service = new BrowserService();
        clientSocket = ioClient(urlString);
        roomsManager['rooms'] = [];
    });

    afterEach(() => {
        clientSocket.close();
        sinon.restore();
        server.removeAllListeners();
    });

    after(() => {
        server.close();
        httpServer.close();
    });

    it('browser reconnection should call clear timeout if the old sockets are equal', (done) => {
        const oldClientId = '123';
        const timeoutSpy = sinon.spy(global, 'clearTimeout');
        const roomsManagerMock = sinon.mock(roomsManager);
        roomsManagerMock.expects('switchPlayerSocket').once();
        service['tempClientSocketId'] = oldClientId;
        const testTimeoutId = setTimeout(() => {
            assert(false);
        }, RESPONSE_DELAY);
        service['timeoutId'] = testTimeoutId;
        clientSocket.emit('browser reconnection', oldClientId);
        setTimeout(() => {
            assert(timeoutSpy.calledWith(testTimeoutId) === true);
            roomsManagerMock.verify();
            roomsManagerMock.restore();
            done();
        }, RESPONSE_DELAY);
    });

    it('browser reconnection should not call clear timeout if the old sockets are different', (done) => {
        const oldClientId = '123';
        const timeoutSpy = sinon.spy(global, 'clearTimeout');
        const testTimeoutId = setTimeout(() => {
            assert(timeoutSpy.calledWith(testTimeoutId) === false);
            done();
        }, RESPONSE_DELAY);
        service['timeoutId'] = testTimeoutId;
        service['tempClientSocketId'] = '100';
        clientSocket.emit('browser reconnection', oldClientId);
    });

    it('closed browser should call room.quitRoomHost', (done) => {
        const room = {
            game: null,
            quitRoomHost: () => {
                return;
            },
            surrenderGame: () => {
                return;
            },
        } as unknown as Room;
        const spyOnQuitRoomHost = stub(room, 'quitRoomHost');
        roomsManager['rooms'].push(room);
        const userId = '123';
        stub(roomsManager, 'getRoom').callsFake(() => room);
        clientSocket.emit('closed browser', userId);
        setTimeout(() => {
            expect(spyOnQuitRoomHost.calledOnce).to.equal(true);
            done();
        }, RESPONSE_DELAY);
    });

    it('closed browser should assign a new tempClientSocketId and tempServerSocket', (done) => {
        const userId = '123';
        clientSocket.emit('closed browser', userId);
        setTimeout(() => {
            expect(service['tempClientSocketId']).to.deep.equal(userId);
            expect(service['tempServerSocket'].id).to.deep.equal(clientSocket.id);
            done();
        }, RESPONSE_DELAY);
    });

    it('closed browser should set a 5 second timeout and call surrenderGame from the room received ', (done) => {
        const testUserId = '123';
        const fakeRoom = {
            surrenderGame: () => {
                done();
            },
            quitRoomHost: () => {
                return;
            },
        } as unknown as Room;
        sinon.stub(roomsManager, 'getRoom').callsFake(() => {
            return fakeRoom;
        });
        clientSocket.emit('closed browser', testUserId);
    });

    it('closed browser should set a 5 second timeout and pass if getRoom returns undefined  ', (done) => {
        const testUserId = '123';
        const getRoomStub = sinon.stub(roomsManager, 'getRoom').callsFake(() => {
            return undefined;
        });
        const maxTimeout = 5500;
        clientSocket.emit('closed browser', testUserId);
        setTimeout(() => {
            assert(getRoomStub.called === true);
            done();
        }, maxTimeout);
    });
});
