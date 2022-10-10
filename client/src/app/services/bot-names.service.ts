import { Injectable } from '@angular/core';
import { loadBotNamesSuccess } from '@app/actions/bot-names.actions';
import { Store } from '@ngrx/store';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class BotNamesService {
    constructor(private socketService: SocketClientService, private store: Store) {}

    getBotNames(): void {
        this.socketService.send('get bot names');
        this.socketService.on('receive bot name', (arr: { easy: string[]; hard: string[] }) => {
            this.store.dispatch(loadBotNamesSuccess({ names: arr }));
        });
    }

    addBotName(name: string, difficulty: string): void {
        this.socketService.send('add bot name', { name, difficulty });
    }

    deleteBotName(name: string, difficulty: string): void {
        this.socketService.send('delete bot name', { name, difficulty });
    }

    modifyBotName(previousName: string, modifiedName: string): void {
        this.socketService.send('modify bot name', { previousName, modifiedName });
    }

    resetBotNames(): void {
        this.socketService.send('reset all names');
    }
}
