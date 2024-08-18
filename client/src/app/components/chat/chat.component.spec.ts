import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ChatGameService } from '@app/services/game/chat.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_PLAYER_MODE } from '@common/constants';
import { ChatMessage } from '@common/interfaces';
import { Subject } from 'rxjs';
import { ChatComponent } from './chat.component';
class MockStateGameService {
    playerMode: GAME_PLAYER_MODE = GAME_PLAYER_MODE.SINGLE_PLAYER;
    playerModeChanged = new Subject<GAME_PLAYER_MODE>();
    chatHistory: ChatMessage[] = [];
    chatHistoryChanged = new Subject<ChatMessage[]>();
    isSinglePlayer = () => {
        return true;
    };
    isMultiPlayer = () => {
        return false;
    };
}
class MockChatGameService {
    sendMessage() {
        return;
    }
    addChatMessage() {
        return;
    }
    setChat() {
        return;
    }
}

describe('ChatSoloComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatIconModule],
            declarations: [ChatComponent],
            providers: [
                { provide: StateGameService, useClass: MockStateGameService },
                { provide: ChatGameService, useClass: MockChatGameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a chatHistory', () => {
        expect(component.chatHistory).toBeTruthy();
    });

    it('colorToStyle should return a rgb string', () => {
        expect(component.colorToStyle({ r: 0, g: 0, b: 0 })).toBe('rgb(0, 0, 0)');
    });

    it('should subscribe to playerModeChanged', () => {
        component.playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        component['stateGameService'].playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        component['stateGameService'].playerModeChanged.next(GAME_PLAYER_MODE.MULTI_PLAYER);
        expect(component.playerMode).toBe(GAME_PLAYER_MODE.MULTI_PLAYER);
    });

    it('should subscribe to chatHistoryChanged', () => {
        const testChatMessage: ChatMessage = {
            username: 'test',
            message: 'test',
            time: 0,
            textColor: { r: 0, g: 0, b: 0 },
            backgroundColor: { r: 0, g: 0, b: 0 },
        };
        component.chatHistory = [];
        component['stateGameService'].chatHistory = [testChatMessage];
        component['stateGameService'].chatHistoryChanged.next([testChatMessage]);
        expect(component.chatHistory).toEqual([testChatMessage]);
    });

    it('should unsubscribe from playerModeChanged', () => {
        const playerModeChangedSpy = spyOn(component['playerModeSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(playerModeChangedSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from chatHistoryChanged', () => {
        const chatHistoryChangedSpy = spyOn(component['chatHistorySubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(chatHistoryChangedSpy).toHaveBeenCalled();
    });

    it('isSinglePlayer should return this.stateGameService.isSinglePlayer()', () => {
        const isSinglePlayerSpy = spyOn(component['stateGameService'], 'isSinglePlayer');
        component.isSinglePlayer();
        expect(isSinglePlayerSpy).toHaveBeenCalled();
    });

    it('isMultiPlayer should return this.stateGameService.isMultiPlayer()', () => {
        const isMultiPlayerSpy = spyOn(component['stateGameService'], 'isMultiPlayer');
        component.isMultiPlayer();
        expect(isMultiPlayerSpy).toHaveBeenCalled();
    });

    it('sendMessage should call this.stateGameService.chatGameService.sendMessage()', () => {
        component.messageInput.nativeElement.value = 'test';
        const sendMessageSpy = spyOn(component['chatGameService'], 'sendMessage');
        component.sendMessage();
        expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('sendMessage should call this.stateGameService.chatGameService.addChatMessage()', () => {
        component.messageInput.nativeElement.value = 'test';
        const addChatMessageSpy = spyOn(component['chatGameService'], 'addChatMessage');
        component.sendMessage();
        expect(addChatMessageSpy).toHaveBeenCalled();
    });

    it('sendMessage should call this.stateGameService.chatGameService.setChat()', () => {
        component.messageInput.nativeElement.value = 'test';
        const setChatSpy = spyOn(component['chatGameService'], 'setChat');
        component.sendMessage();
        expect(setChatSpy).toHaveBeenCalled();
    });

    it('sendMessage should set the messageInput to an empty string', () => {
        component.messageInput.nativeElement.value = 'test';
        component.sendMessage();
        expect(component.messageInput.nativeElement.value).toBe('');
    });

    it('sendMessage should not call this.stateGameService.chatGameService.sendMessage() if the messageInput is empty', () => {
        component.messageInput.nativeElement.value = '';
        const sendMessageSpy = spyOn(component['chatGameService'], 'sendMessage');
        component.sendMessage();
        expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('verifyKeyPress should return false if the key pressed is Enter but should call sendMessage and preventDefault', () => {
        const sendMessageSpy = spyOn(component, 'sendMessage');
        expect(
            component.verifyKeyPress({
                key: 'Enter',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeFalsy();
        expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('verifyKeyPress should return true if the key pressed is a letter', () => {
        expect(
            component.verifyKeyPress({
                key: 'a',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return true if the key pressed is a number', () => {
        expect(
            component.verifyKeyPress({
                key: '1',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return true if the key pressed is a space', () => {
        expect(
            component.verifyKeyPress({
                key: ' ',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return false if the key pressed is a special character', () => {
        expect(
            component.verifyKeyPress({
                key: '!',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeFalsy();
    });

    it('verifyKeyPress should return true if the key pressed is a backspace', () => {
        expect(
            component.verifyKeyPress({
                key: 'Backspace',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return true if the key pressed is a Delete', () => {
        expect(
            component.verifyKeyPress({
                key: 'Delete',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });
});
