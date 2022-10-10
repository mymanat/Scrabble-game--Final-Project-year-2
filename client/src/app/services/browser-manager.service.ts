import { Injectable } from '@angular/core';
import { initiateChatting, restoreMessages } from '@app/actions/chat.actions';
import { getGameStatus, refreshTimer } from '@app/actions/game-status.actions';
import { ChatBox } from '@app/reducers/chat.reducer';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { SocketClientService } from '@app/services/socket-client.service';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

const waitingTime = 200;
const thousandMilliseconds = 1000;
@Injectable({
    providedIn: 'root',
})
export class BrowserManagerService {
    private gameStatus$: Observable<GameStatus>;
    private chat$: Observable<ChatBox>;
    constructor(public socketService: SocketClientService, private store: Store<{ gameStatus: GameStatus; chat: ChatBox }>) {
        this.gameStatus$ = this.store.select('gameStatus');
        this.chat$ = this.store.select('chat');
    }
    onBrowserClosed(): void {
        this.socketService.send('closed browser', this.socketService.socket.id);
        const date = new Date();
        const expiryTimer = 5000;
        date.setTime(date.getTime() + expiryTimer);
        const expires = '; expires=' + date.toUTCString();
        document.cookie = 'socket=' + (this.socketService.socket.id || '') + expires + '; path=/';
        this.storeSelectors();
    }

    onBrowserLoad(): void {
        if (!this.socketService.isSocketAlive()) this.socketService.connect();
        const oldSocketId = this.readCookieSocket;
        if (!oldSocketId) return;
        this.socketService.send('browser reconnection', oldSocketId);
        this.store.dispatch(initiateChatting());
        this.store.dispatch(getGameStatus());
        this.retrieveSelectors();
        setTimeout(() => {
            const date = new Date();
            const oldTimer = localStorage.getItem('currentTimer');
            if (!oldTimer) return;
            const parsedTimer = JSON.parse(oldTimer);
            const diffDate = Math.round((date.getTime() - parsedTimer.date) / thousandMilliseconds);
            let timer = 0;
            this.gameStatus$.subscribe((gameStatus) => (timer = gameStatus.timer));
            this.store.dispatch(refreshTimer({ timer: (parsedTimer.countdown - diffDate) % timer }));
        }, waitingTime);
    }

    private storeSelectors(): void {
        this.chat$.pipe(take(1)).subscribe((messages) => localStorage.setItem('chatMessages', JSON.stringify(messages.chatMessage)));
    }

    private retrieveSelectors(): void {
        const oldMessages = localStorage.getItem('chatMessages');
        localStorage.removeItem('chatMessages');
        if (!oldMessages) return;
        this.store.dispatch(restoreMessages({ oldMessages: JSON.parse(oldMessages) }));
    }

    get readCookieSocket(): string | undefined {
        const cookieName = 'socket';
        const cookies = document.cookie.split(';');
        const socketCookie = cookies.find((cookie) => cookie.includes(cookieName));
        return socketCookie?.split('=')[1];
    }
}
