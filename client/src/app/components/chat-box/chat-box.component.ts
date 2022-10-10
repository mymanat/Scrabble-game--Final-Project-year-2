import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import * as chatActions from '@app/actions/chat.actions';
import { ChatBox } from '@app/reducers/chat.reducer';
import { GameStatus } from '@app/reducers/game-status.reducer';
import { Players } from '@app/reducers/player.reducer';
import { KeyManagerService } from '@app/services/key-manager.service';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-chat-box',
    templateUrl: './chat-box.component.html',
    styleUrls: ['./chat-box.component.scss'],
})
export class ChatBoxComponent implements OnInit, AfterViewChecked {
    @ViewChild('chatMessage', { static: true }) private chatMessage: ElementRef<HTMLInputElement>;
    chat$: Observable<ChatBox>;
    username: string;
    gameEnded: boolean;
    private numberOfLastMessages: number;
    constructor(
        private store: Store<{ chat: ChatBox; gameStatus: GameStatus }>,
        private playerStore: Store<{ players: Players }>,
        private eRef: ElementRef,
        private keyManager: KeyManagerService,
        private changeDetector: ChangeDetectorRef,
    ) {
        this.chat$ = store.select('chat');
        this.playerStore.select('players').subscribe((players) => (this.username = players.player.name));
        this.numberOfLastMessages = 0;
    }

    @HostListener('document:click', ['$event'])
    clickout(event: Event): void {
        this.numberOfLastMessages = 0;
        if (!this.eRef.nativeElement.contains(event.target)) return;
        this.keyManager.onEsc();
        this.chatMessage.nativeElement.focus();
    }

    @HostListener('keydown', ['$event'])
    keyPressed(event: KeyboardEvent): void {
        if (event.key === 'ArrowUp') this.numberOfLastMessages++;
        else if (event.key === 'ArrowDown') this.numberOfLastMessages = this.numberOfLastMessages <= 1 ? 1 : --this.numberOfLastMessages;
        else return;
        let previousMessage = '';

        this.chat$.subscribe((chatBox) => {
            const lastMessagesLength = chatBox.lastSendMessage.length;
            this.numberOfLastMessages = this.numberOfLastMessages > lastMessagesLength ? lastMessagesLength : this.numberOfLastMessages;
            previousMessage = chatBox.lastSendMessage[lastMessagesLength - this.numberOfLastMessages];
        });
        if (previousMessage) this.chatMessage.nativeElement.value = previousMessage;
    }

    ngOnInit(): void {
        this.store.dispatch(chatActions.initiateChatting());
        this.chatMessage.nativeElement.focus();
        this.store.select('gameStatus').subscribe((gameStatus) => {
            this.gameEnded = gameStatus.gameEnded;
            if (gameStatus.gameEnded) this.chatMessage.nativeElement.focus();
        });
    }

    ngAfterViewChecked() {
        this.changeDetector.detectChanges();
    }

    submitMessage(): void {
        this.numberOfLastMessages = 0;
        if (!this.chatMessage.nativeElement.value) return;
        this.store.dispatch(chatActions.messageWritten({ username: this.username, message: this.chatMessage.nativeElement.value }));
        this.chatMessage.nativeElement.value = '';
    }

    chatBoxBlur(): void {
        if (this.gameEnded) this.chatMessage.nativeElement.focus();
    }

    sendHintMessage(message: string): void {
        this.keyManager.onEsc();
        if (!(message.startsWith('!placer') && !this.gameEnded)) return;
        this.numberOfLastMessages = 0;
        this.store.dispatch(chatActions.messageWritten({ username: this.username, message }));
    }
}
