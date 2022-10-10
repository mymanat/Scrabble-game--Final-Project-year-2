// Fichier issu de l'exemple du cours de socketIo
// https://gitlab.com/nikolayradoev/socket-io-exemple/-/tree/master

import { TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/helper/socket-test-helper';
import * as SocketClient from 'socket.io-client';
import { SocketClientService } from './socket-client.service';

describe('SocketClientService', () => {
    let service: SocketClientService;
    let socketHelper: SocketTestHelper;
    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
        service.disconnect();
        service.socket = socketHelper as unknown as SocketClient.Socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should disconnect', () => {
        const spy = spyOn(service.socket, 'disconnect');
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('should not connect if socket is alive', () => {
        spyOn(service, 'isSocketAlive').and.callFake(() => true);
        const oldSocket = service.socket;
        service.connect();
        expect(oldSocket).toBe(service.socket);
    });

    it('should self disconnect when destroy', () => {
        const spy = spyOn(service, 'disconnect');
        service.ngOnDestroy();
        expect(spy).toHaveBeenCalled();
    });

    it('resetConnection should call disconnect and connect', () => {
        const disconnectSpy = spyOn(service, 'disconnect');
        const connectSpy = spyOn(service, 'connect');
        service.resetConnection();
        expect(disconnectSpy).toHaveBeenCalled();
        expect(connectSpy).toHaveBeenCalled();
    });

    it('isSocketAlive should return true if the socket is still connected', () => {
        service.socket.connected = true;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeTruthy();
    });

    it('isSocketAlive should return false if the socket is no longer connected', () => {
        service.socket.connected = false;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeFalsy();
    });

    it('isSocketAlive should return false if the socket is not defined', () => {
        (service.socket as unknown) = undefined;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeFalsy();
    });

    it('should call socket.on with an event', () => {
        const event = 'helloWorld';
        const action = () => {
            return;
        };
        const spy = spyOn(service.socket, 'on');
        service.on(event, action);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, action);
    });

    it('should call emit with data when using send', () => {
        const event = 'helloWorld';
        const data = 42;
        const spy = spyOn(service.socket, 'emit');
        service.send(event, data);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, data);
    });

    it('should call emit without data when using send if data is undefined', () => {
        const event = 'helloWorld';
        const data = undefined;
        const spy = spyOn(service.socket, 'emit');
        service.send(event, data);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event);
    });
});
