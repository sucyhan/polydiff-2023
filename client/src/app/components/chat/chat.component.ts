import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatGameService } from '@app/services/game/chat.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_PLAYER_MODE, GAME_STATE } from '@common/constants';
import { ChatColor, ChatMessage } from '@common/interfaces';
import { Subject, Subscription } from 'rxjs';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
    @ViewChild('chatInput') messageInput: ElementRef<HTMLTextAreaElement>;
    eventsSubject: Subject<void> = new Subject<void>();
    playerMode: GAME_PLAYER_MODE = GAME_PLAYER_MODE.SINGLE_PLAYER;
    playerModeSubscription: Subscription;
    chatHistory: ChatMessage[] = [];
    chatHistorySubscription: Subscription;
    constructor(private readonly stateGameService: StateGameService, private readonly chatGameService: ChatGameService) {}

    colorToStyle(color: ChatColor): string {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    ngOnInit(): void {
        this.playerMode = this.stateGameService.playerMode;
        this.playerModeSubscription = this.stateGameService.playerModeChanged.subscribe(() => {
            this.playerMode = this.stateGameService.playerMode;
        });
        this.chatHistory = this.stateGameService.chatHistory;
        this.chatHistorySubscription = this.stateGameService.chatHistoryChanged.subscribe(() => {
            this.chatHistory = this.stateGameService.chatHistory;
        });
    }
    ngOnDestroy(): void {
        this.playerModeSubscription.unsubscribe();
        this.chatHistorySubscription.unsubscribe();
    }
    isSinglePlayer(): boolean {
        return this.stateGameService.isSinglePlayer() || this.stateGameService.gameState === GAME_STATE.REPLAY;
    }
    isMultiPlayer(): boolean {
        return this.stateGameService.isMultiPlayer();
    }
    sendMessage() {
        this.messageInput.nativeElement.value = this.messageInput.nativeElement.value.replace(/\n/g, '');
        if (this.messageInput.nativeElement.value !== '') {
            this.chatGameService.sendMessage(
                this.messageInput.nativeElement.value,
                this.stateGameService.currentPlayerUsername,
                this.stateGameService.time,
            );
            this.chatGameService.addChatMessage(
                this.chatGameService.setChat(
                    this.messageInput.nativeElement.value,
                    this.stateGameService.currentPlayerUsername,
                    this.stateGameService.time,
                ),
            );
            this.messageInput.nativeElement.value = '';
        }
    }
    verifyKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.sendMessage();
            return false;
        } else if (/[a-zA-Z0-9]/.test(event.key) || event.key === 'Backspace' || event.key === 'Delete' || event.key === ' ') {
            return true;
        } else {
            event.preventDefault();
            return false;
        }
    }
}
