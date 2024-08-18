import { Injectable } from '@angular/core';
import { GAME_EVENTS, GAME_PLAYER_MODE, GAME_TIMER_MODE } from '@common/constants';
import { ChatMessage, UsersScore, messageScoreInfo } from '@common/interfaces';
import { StateGameService } from './state.game.service';
@Injectable({
    providedIn: 'root',
})
export class ChatGameService {
    constructor(private readonly stateGameService: StateGameService) {}

    setChat(message: string, username: string, time: number) {
        const chatMessage: ChatMessage = {
            username,
            message,
            time,
            textColor: { r: 0, g: 0, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        return chatMessage;
    }

    setHintUsed(time: number) {
        const chatMessage: ChatMessage = {
            username: '',
            message: 'Indice utilisé',
            time,
            textColor: { r: 30, g: 153, b: 230 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        return chatMessage;
    }

    setFoundDifferences(username: string, time: number) {
        const chatMessage: ChatMessage = {
            username: '',
            message: 'Différence trouvée par ' + username,
            time,
            textColor: { r: 67, g: 189, b: 43 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        if (this.stateGameService.isSinglePlayer()) {
            chatMessage.message = 'Différence trouvée';
        }
        return chatMessage;
    }
    setErrorDifference(username: string, time: number) {
        const chat: ChatMessage = {
            username: '',
            message: 'Erreur par ' + username,
            time,
            textColor: { r: 204, g: 0, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        if (this.stateGameService.isSinglePlayer()) {
            chat.message = 'Erreur commise';
        }
        return chat;
    }

    setDisconnectedPlayer(username: string, time: number) {
        const chat: ChatMessage = {
            username: '',
            message: username + ' a abandonné la partie.',
            time,
            textColor: { r: 204, g: 0, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        return chat;
    }

    createNewRecordMessage(userScore: UsersScore, info: messageScoreInfo) {
        const chat: ChatMessage = {
            username: '',
            message: `${userScore.name} obtient la ${info.position} place dans les meilleurs temps du jeu ${info.gameName} en ${
                info.mode === GAME_PLAYER_MODE.SINGLE_PLAYER ? 'mode solo' : 'mode multijoueur'
            }.`,
            time: userScore.time,
            textColor: { r: 255, g: 165, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        return chat;
    }

    fromCurrentToRoom(chatMessage: ChatMessage) {
        const newChat: ChatMessage = {
            username: chatMessage.username,
            message: chatMessage.message,
            time: chatMessage.time,
            textColor: { r: 255, g: 0, b: 255 },
            backgroundColor: chatMessage.backgroundColor,
        };
        return newChat;
    }
    sendMessage(message: string, username: string, time: number) {
        const chat = this.setChat(message, username, time);
        this.stateGameService.replayEvents.push({ type: GAME_EVENTS.MESSAGE, time: this.stateGameService.time, eventData: chat });
        this.stateGameService.socketClient.socket.emit(
            this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC ? 'chatMessage' : 'timedChatMessage',
            this.fromCurrentToRoom(chat),
            this.stateGameService.room,
            this.stateGameService.gameData.id,
        );
    }
    sendDifferenceMessage(username: string, time: number) {
        this.stateGameService.socketClient.socket.emit(
            this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC ? 'chatMessage' : 'timedChatMessage',
            this.setFoundDifferences(username, time),
            this.stateGameService.room,
            this.stateGameService.gameData.id,
        );
    }
    sendDifference(chat: ChatMessage) {
        this.stateGameService.socketClient.socket.emit(
            this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC ? 'chatMessage' : 'timedChatMessage',
            chat,
            this.stateGameService.room,
            this.stateGameService.gameData.id,
        );
    }
    sendErrorMessage(username: string, time: number) {
        this.stateGameService.socketClient.socket.emit(
            this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC ? 'chatMessage' : 'timedChatMessage',
            this.setErrorDifference(username, time),
            this.stateGameService.room,
            this.stateGameService.gameData.id,
        );
    }
    sendDisconnectMessage(username: string, time: number) {
        this.stateGameService.socketClient.socket.emit(
            this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC ? 'chatMessage' : 'timedChatMessage',
            this.setDisconnectedPlayer(username, time),
            this.stateGameService.room,
            this.stateGameService.gameData.id,
        );
    }
    addChatMessage(chatMessage: ChatMessage) {
        const color = { r: 255, g: 0, b: 255 };
        if (chatMessage.textColor.r === color.r && chatMessage.textColor.g === color.g && chatMessage.textColor.b === color.b) {
            this.stateGameService.replayEvents.push({ type: GAME_EVENTS.MESSAGE, time: this.stateGameService.time, eventData: chatMessage });
        }
        this.stateGameService.chatHistory = this.stateGameService.chatHistory.reverse();
        this.stateGameService.chatHistory.push(chatMessage);
        this.stateGameService.chatHistory = this.stateGameService.chatHistory.reverse();
        this.stateGameService.chatHistoryChanged.next(this.stateGameService.chatHistory);
    }
}
