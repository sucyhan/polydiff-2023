import { TestBed } from '@angular/core/testing';
import { GAME_PLAYER_MODE, GAME_TIMER_MODE } from '@common/constants';
import { ChatMessage, GameData, GameEvent, UsersScore, messageScoreInfo } from '@common/interfaces';
import { Subject } from 'rxjs';
import { ChatGameService } from './chat.game.service';
import { StateGameService } from './state.game.service';

class MockStateGameService {
    chatHistory: ChatMessage[] = [];
    timerMode: GAME_TIMER_MODE = GAME_TIMER_MODE.CLASSIC;
    chatHistoryChanged = new Subject<ChatMessage[]>();
    room: string = '';
    roomChanged = new Subject<string>();
    replayEvents: GameEvent[] = [];
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    gameDataChanged = new Subject<GameData>();
    socketClient = {
        socket: {
            emit: () => {
                return;
            },
        },
    };
    isSinglePlayer(): boolean {
        return false;
    }
}

describe('ChatGameService', () => {
    let service: ChatGameService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: StateGameService, useClass: MockStateGameService }],
        });
        service = TestBed.inject(ChatGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('setChat should return a ChatMessage', () => {
        const chatMessage = service.setChat('test', 'You', 0);
        expect(chatMessage).toEqual({
            message: 'test',
            username: 'You',
            time: 0,
            textColor: { r: 0, g: 0, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        });
    });

    it('setFoundDifference should return a ChatMessage with par PLAYER if not isSinglePlayer', () => {
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(false);
        const chatMessage = service.setFoundDifferences('You', 0);
        expect(chatMessage).toEqual({
            message: 'Différence trouvée par You',
            username: '',
            time: 0,
            textColor: { r: 67, g: 189, b: 43 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        });
    });

    it('setFoundDifference should return a ChatMessage if isSinglePlayer', () => {
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(true);
        const chatMessage = service.setFoundDifferences('You', 0);
        expect(chatMessage).toEqual({
            message: 'Différence trouvée',
            username: '',
            time: 0,
            textColor: { r: 67, g: 189, b: 43 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        });
    });

    it('setErrorDifference should return a ChatMessage with par PLAYER if not isSinglePlayer', () => {
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(false);
        const chatMessage = service.setErrorDifference('You', 0);
        expect(chatMessage).toEqual({
            message: 'Erreur par You',
            username: '',
            time: 0,
            textColor: { r: 204, g: 0, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        });
    });

    it('setErrorDifference should return a ChatMessage if isSinglePlayer', () => {
        spyOn(service['stateGameService'], 'isSinglePlayer').and.returnValue(true);
        const chatMessage = service.setErrorDifference('You', 0);
        expect(chatMessage).toEqual({
            message: 'Erreur commise',
            username: '',
            time: 0,
            textColor: { r: 204, g: 0, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        });
    });

    it('setDisconnectedPlayer should return a ChatMessage', () => {
        const chatMessage = service.setDisconnectedPlayer('You', 0);
        expect(chatMessage).toEqual({
            message: 'You a abandonné la partie.',
            username: '',
            time: 0,
            textColor: { r: 204, g: 0, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        });
    });

    it('fromCurrentToRoom should return a ChatMessage', () => {
        const testMessage = {
            message: 'test',
            username: '',
            time: 0,
            textColor: { r: 67, g: 189, b: 43 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        const chatMessage = service.fromCurrentToRoom(testMessage);
        expect(chatMessage).toEqual({
            message: 'test',
            username: '',
            time: 0,
            textColor: { r: 255, g: 0, b: 255 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        });
    });

    it('sendMessage should emit a message', () => {
        spyOn(service, 'setChat').and.returnValue({} as ChatMessage);
        spyOn(service, 'fromCurrentToRoom').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendMessage('test', 'You', 0);
        expect(spy).toHaveBeenCalled();
    });

    it('sendDifferenceMessage should emit a message', () => {
        spyOn(service, 'setFoundDifferences').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendDifferenceMessage('You', 0);
        expect(spy).toHaveBeenCalled();
    });

    it('sendDifference error should emit a message', () => {
        const testMessage = {
            message: 'test',
            username: '',
            time: 0,
            textColor: { r: 67, g: 189, b: 43 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        spyOn(service, 'setErrorDifference').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendDifference(testMessage);
        expect(spy).toHaveBeenCalled();
    });

    it('sendErrorMessage should emit a message', () => {
        spyOn(service, 'setErrorDifference').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendErrorMessage('You', 0);
        expect(spy).toHaveBeenCalled();
    });

    it('sendDisconnectMessage should emit a message', () => {
        spyOn(service, 'setDisconnectedPlayer').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendDisconnectMessage('You', 0);
        expect(spy).toHaveBeenCalled();
    });

    it('addChatMessage should add a message to the first position of the chatHistory', () => {
        const testMessage = {
            message: 'test',
            username: '',
            time: 0,
            textColor: { r: 67, g: 189, b: 43 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        service['stateGameService'].chatHistory = [{} as ChatMessage];
        service.addChatMessage(testMessage);
        expect(service['stateGameService'].chatHistory[0]).toEqual(testMessage);
    });

    it('addChatMessage should add a message to the first position of the chatHistory with', () => {
        const testMessage = {
            message: 'test',
            username: '',
            time: 0,
            textColor: { r: 255, g: 0, b: 255 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        service['stateGameService'].chatHistory = [{} as ChatMessage];
        service.addChatMessage(testMessage);
        expect(service['stateGameService'].chatHistory[0]).toEqual(testMessage);
    });

    it('createNewRecordMessage should create good message (solo)', () => {
        const userScore: UsersScore = { name: 'baby', time: 1 };
        const info: messageScoreInfo = { position: 1, gameName: 'Hello there', mode: GAME_PLAYER_MODE.SINGLE_PLAYER };
        expect(service.createNewRecordMessage(userScore, info).time).toEqual(userScore.time);
    });
    it('createNewRecordMessage should create good message (multi)', () => {
        const userScore: UsersScore = { name: 'baby', time: 1 };
        const info: messageScoreInfo = { position: 1, gameName: 'Hello there', mode: GAME_PLAYER_MODE.MULTI_PLAYER };
        expect(service.createNewRecordMessage(userScore, info).time).toEqual(userScore.time);
    });

    it('setHintUsed should return good hint message', () => {
        const time = 10;
        const chatMessage: ChatMessage = {
            username: '',
            message: 'Indice utilisé',
            time,
            textColor: { r: 30, g: 153, b: 230 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        expect(service.setHintUsed(time).time).toEqual(chatMessage.time);
    });

    it('sendMessage should emit a message', () => {
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        spyOn(service, 'setChat').and.returnValue({} as ChatMessage);
        spyOn(service, 'fromCurrentToRoom').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendMessage('test', 'You', 0);
        expect(spy).toHaveBeenCalled();
    });

    it('sendDifferenceMessage should emit a message', () => {
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        spyOn(service, 'setFoundDifferences').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendDifferenceMessage('You', 0);
        expect(spy).toHaveBeenCalled();
    });

    it('sendDifference error should emit a message', () => {
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        const testMessage = {
            message: 'test',
            username: '',
            time: 0,
            textColor: { r: 67, g: 189, b: 43 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        spyOn(service, 'setErrorDifference').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendDifference(testMessage);
        expect(spy).toHaveBeenCalled();
    });

    it('sendErrorMessage should emit a message', () => {
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        spyOn(service, 'setErrorDifference').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendErrorMessage('You', 0);
        expect(spy).toHaveBeenCalled();
    });

    it('sendDisconnectMessage should emit a message', () => {
        service['stateGameService'].timerMode = GAME_TIMER_MODE.TIMED;
        spyOn(service, 'setDisconnectedPlayer').and.returnValue({} as ChatMessage);
        const spy = spyOn(service['stateGameService'].socketClient.socket, 'emit');
        service.sendDisconnectMessage('You', 0);
        expect(spy).toHaveBeenCalled();
    });
});
