/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { Server } from 'app/server';
import { assert, expect } from 'chai';
import { GameOptions } from 'common/classes/game-options';
import { RoomInfo } from 'common/classes/room-info';
import { GameMode } from 'common/interfaces/game-mode';
import * as sinon from 'sinon';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketService } from './socket-manager.service';

const RESPONSE_DELAY = 200;
describe('SocketManager service tests', () => {
    let service: SocketService;
    let server: Server;
    let clientSocket: Socket;

    const urlString = 'http://localhost:3000';
    beforeEach(async () => {
        server = Container.get(Server);
        server.init();
        service = server['socketService'];
        clientSocket = ioClient(urlString);
    });

    afterEach(() => {
        service.roomManager['rooms'] = [];
        clientSocket.close();
        service['sio'].close();
        sinon.restore();
    });

    it('should handle create room event and emit game settings event', (done) => {
        const defaultOptions: GameOptions = { hostname: 'My Name', dictionaryType: 'My Dictionary', gameMode: GameMode.Classical, timePerRound: 60 };
        clientSocket.emit('create room', defaultOptions);
        clientSocket.on('create room success', (info: RoomInfo) => {
            expect(defaultOptions).to.deep.equal(info.gameOptions);
            done();
        });
    });

    it('should handle request list event and emit get list event with empty list when no rooms are available', (done) => {
        clientSocket.emit('request list');
        clientSocket.on('get list', (listOfRooms) => {
            expect(listOfRooms).to.deep.equal([]);
            expect(listOfRooms).to.be.length(0);
            done();
        });
    });

    it('should handle request list event and call getRooms', (done) => {
        const roomManagerSpy = sinon.spy(service.roomManager, 'sendAvailableRooms');
        clientSocket.emit('request list');
        clientSocket.on('get list', (listOfRooms) => {
            expect(listOfRooms).to.deep.equal([]);
            setTimeout(() => {
                assert(roomManagerSpy.calledOnce);
                done();
            }, RESPONSE_DELAY);
        });
    });

    it('should handle request list event and emit get list event with the hostnames of the accessible rooms', (done) => {
        const defaultOptions: GameOptions = { hostname: 'My Name', dictionaryType: 'My Dictionary', gameMode: GameMode.Classical, timePerRound: 60 };
        clientSocket.emit('create room', defaultOptions);
        clientSocket.emit('request list');
        clientSocket.on('get list', (listOfRooms: RoomInfo[]) => {
            expect(listOfRooms.filter((room) => room.gameOptions.hostname === defaultOptions.hostname).length).to.eq(1);
            expect(listOfRooms).to.be.length(1);
            done();
        });
    });

    it('isOpen should return true when set to default value', (done) => {
        const isOpen: boolean = service.isOpen();
        assert(isOpen === true);
        done();
    });

    it('isOpen should return false when max listener count is 0', (done) => {
        service['sio'].setMaxListeners(0);
        const isOpen: boolean = service.isOpen();
        assert(isOpen === false);
        done();
    });

    it('broadcastMessage should call sockets.emit with the given parameters', (done) => {
        const expectedValue = 'abc';
        const expectedMessage = 'message';
        service['sio'] = {
            sockets: {
                emit: (value: string, message: unknown) => {
                    expect(value).to.equal(expectedValue);
                    expect(message).to.equal(expectedMessage);
                    done();
                    return false;
                },
            } as any,
            close: () => {
                return;
            },
        } as any;
        service.broadcastMessage(expectedValue, expectedMessage);
    });
});
