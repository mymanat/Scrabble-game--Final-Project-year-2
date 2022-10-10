// Fichier issu de l'exemple du cours de socketIo
// https://gitlab.com/nikolayradoev/socket-io-exemple/-/tree/master

import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService implements OnDestroy {
    socket: Socket;

    constructor() {
        this.connect();
    }

    ngOnDestroy(): void {
        this.disconnect();
    }

    resetConnection(): void {
        this.disconnect();
        this.connect();
    }

    isSocketAlive(): boolean {
        return Boolean(this.socket?.connected);
    }

    connect() {
        if (!this.isSocketAlive()) this.socket = io(environment.serverUrl, { transports: ['websocket'], upgrade: false, closeOnBeforeunload: false });
    }

    disconnect() {
        this.socket.disconnect();
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.removeAllListeners(event);
        this.socket.on(event, action);
    }

    send<T>(event: string, data?: T): void {
        if (data) {
            this.socket.emit(event, data);
        } else {
            this.socket.emit(event);
        }
    }
}
