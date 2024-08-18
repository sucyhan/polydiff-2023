import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SocketClientService } from '@app/services/socket-client.service';
import { CONFIGURATION_GAME_CONSTANTS, GAME_PLAYER_MODE, GAME_STATE, GAME_TIMER_MODE } from '@common/constants';
import { ChatMessage, GameConstants, GameData, GameEvent, PlayerData } from '@common/interfaces';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class StateGameService {
    gameState: GAME_STATE = GAME_STATE.LOBBY;
    gameStateChanged = new Subject<GAME_STATE>();
    playerMode: GAME_PLAYER_MODE = GAME_PLAYER_MODE.SINGLE_PLAYER;
    playerModeChanged = new Subject<GAME_PLAYER_MODE>();
    timerMode: GAME_TIMER_MODE = GAME_TIMER_MODE.CLASSIC;
    timerModeChanged = new Subject<GAME_TIMER_MODE>();
    time: number = 0;
    timeChanged = new Subject<number>();
    startDate: Date = new Date();
    endDate: Date = new Date();
    gameData: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [],
    };
    gameDataChanged = new Subject<GameData>();
    canMakeMove: boolean = true;
    canMakeMoveChanged = new Subject<boolean>();
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    currentPlayerUsername: string = '';
    currentPlayerUsernameChanged = new Subject<string>();
    chatHistory: ChatMessage[] = [];
    chatHistoryChanged = new Subject<ChatMessage[]>();
    room: string = '';
    roomChanged = new Subject<string>();
    opponentUsername: string = '';
    gameConstants: GameConstants[] = CONFIGURATION_GAME_CONSTANTS;
    gameConstantsChanged = new Subject<GameConstants[]>();
    idPlayed: number[] = [];
    idPlayedChanged = new Subject<number[]>();
    opponentQuit: boolean = false;
    replayEvents: GameEvent[] = [];
    gameEnded: boolean = false;

    constructor(readonly http: HttpClient, readonly router: Router, readonly socketClient: SocketClientService) {}

    get currentPlayer(): PlayerData {
        return this.players.find((player) => player.username === this.currentPlayerUsername) as PlayerData;
    }

    isSinglePlayer(): boolean {
        return this.playerMode === GAME_PLAYER_MODE.SINGLE_PLAYER;
    }
    isMultiPlayer(): boolean {
        return this.playerMode === GAME_PLAYER_MODE.MULTI_PLAYER;
    }
    isClassic(): boolean {
        return this.timerMode === GAME_TIMER_MODE.CLASSIC;
    }
    isTimed(): boolean {
        return this.timerMode === GAME_TIMER_MODE.TIMED;
    }
}
