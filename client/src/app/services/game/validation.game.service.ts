import { Injectable } from '@angular/core';
import { FILE_TYPE, GAME_CONSTANTS_NAME, GAME_EVENTS, GAME_STATE, GAME_TIMER_MODE, MAX_TIME, TIME } from '@common/constants';
import { ChatMessage, Difference, GameData, Point, Rectangle } from '@common/interfaces';
import { ValidIdsMessage } from '@common/messages';
import { environment } from 'src/environments/environment';
import { ChatGameService } from './chat.game.service';
import { StateGameService } from './state.game.service';
import { TimerGameService } from './timer.game.service';
@Injectable({
    providedIn: 'root',
})
export class ValidationGameService {
    private readonly storageUrl: string = environment.serverUrl + '/storage';
    constructor(
        private readonly stateGameService: StateGameService,
        private readonly timerGameService: TimerGameService,
        private readonly chatGameService: ChatGameService,
    ) {}
    validateMove(coordinate: Point): void {
        this.stateGameService.canMakeMove = false;
        this.stateGameService.canMakeMoveChanged.next(this.stateGameService.canMakeMove);
        if (this.checkCoordinateIsAlreadyFound(coordinate)) return this.invalidMoveMade(coordinate);
        this.stateGameService.socketClient.send('validateMove', [coordinate, this.stateGameService.players, this.stateGameService.gameData]);
    }
    checkCoordinateIsAlreadyFound(coordinate: Point): boolean {
        for (const player of this.stateGameService.players) {
            for (const difference of player.differencesFound) {
                for (const rectangle of difference.rectangles) {
                    if (this.isPointInRectangle(coordinate, rectangle)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isPointInRectangle(point: Point, rectangle: Rectangle): boolean {
        return point.x >= rectangle.point1.x && point.x <= rectangle.point2.x && point.y >= rectangle.point1.y && point.y <= rectangle.point2.y;
    }

    validMoveMade(difference: Difference): void {
        if (this.stateGameService.timerMode === GAME_TIMER_MODE.TIMED) this.loadNextTimedGame();
        else {
            this.stateGameService.currentPlayer.differencesFound.push(difference);
            this.stateGameService.playersChanged.next(this.stateGameService.players);
        }
        this.stateGameService.canMakeMove = true;
        this.stateGameService.canMakeMoveChanged.next(this.stateGameService.canMakeMove);
        const newChat: ChatMessage = this.chatGameService.setFoundDifferences(
            this.stateGameService.currentPlayerUsername,
            this.stateGameService.time,
        );
        if (this.stateGameService.isMultiPlayer()) {
            if (this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC) {
                this.stateGameService.socketClient.socket.emit(
                    'updateGamePlayers',
                    this.stateGameService.players,
                    this.stateGameService.room,
                    this.stateGameService.gameData.id,
                );
            }
            this.chatGameService.sendDifference(newChat);
        }
        this.chatGameService.addChatMessage(newChat);
        this.stateGameService.canMakeMoveChanged.next(this.stateGameService.canMakeMove);
        if (this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC) {
            setTimeout(() => {
                this.endGameCheck();
            }, TIME.ONE_SECOND);
        }
    }
    invalidMoveMade(coordinate: Point): void {
        setTimeout(() => {
            this.stateGameService.canMakeMove = true;
            this.stateGameService.canMakeMoveChanged.next(this.stateGameService.canMakeMove);
            this.clearInvalidMoves();
        }, TIME.ONE_SECOND);
        this.stateGameService.currentPlayer.invalidMoves.push(coordinate);
        this.stateGameService.playersChanged.next(this.stateGameService.players);
        const newChat: ChatMessage = this.chatGameService.setErrorDifference(this.stateGameService.currentPlayerUsername, this.stateGameService.time);
        if (this.stateGameService.isMultiPlayer()) {
            this.chatGameService.sendErrorMessage(this.stateGameService.currentPlayerUsername, this.stateGameService.time);
        }
        this.chatGameService.addChatMessage(newChat);
    }

    clearInvalidMoves() {
        this.stateGameService.currentPlayer.invalidMoves = [];
        this.stateGameService.playersChanged.next(this.stateGameService.players);
    }

    endGameCheck() {
        if (this.stateGameService.gameState !== GAME_STATE.IN_GAME) return;
        for (const player of this.stateGameService.players) {
            if (player.differencesFound.length >= this.stateGameService.gameData.numberOfDifferences / this.stateGameService.players.length) {
                if (this.stateGameService.timerMode === GAME_TIMER_MODE.CLASSIC) {
                    this.timerGameService.stopTimer();
                    this.stateGameService.socketClient.socket.emit('leaveGameRoom', this.stateGameService.room, this.stateGameService.gameData.id);
                    this.stateGameService.replayEvents.push({ type: GAME_EVENTS.END, time: this.stateGameService.time, eventData: {} });
                    if (
                        this.stateGameService.currentPlayer.differencesFound.length >=
                        this.stateGameService.gameData.numberOfDifferences / this.stateGameService.players.length
                    ) {
                        this.stateGameService.gameState = GAME_STATE.WON_GAME;
                        this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
                        return;
                    }
                    this.stateGameService.gameState = GAME_STATE.LOST_GAME;
                    this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
                }
            }
        }
    }
    getGameData() {
        this.stateGameService.http
            .post<string>(`${this.storageUrl}/read`, { id: this.stateGameService.gameData.id, type: FILE_TYPE.imageJSON })
            .subscribe((data: string) => {
                const parsedData: GameData = JSON.parse(data);
                this.stateGameService.gameData = parsedData;
                this.stateGameService.gameDataChanged.next(parsedData);
            });
    }
    loadNextTimedGame() {
        this.stateGameService.http.get<ValidIdsMessage>(`${this.storageUrl}/getValidIds`).subscribe((data: ValidIdsMessage) => {
            const validIds: number[] = data.validIds;
            const randomIndex: number = Math.floor(Math.random() * validIds.length);

            if (validIds.length < 2) {
                this.stateGameService.gameState = GAME_STATE.OUT_OF_GAMES;
                this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
                this.timerGameService.stopTimer();
                return;
            }

            for (const index of validIds.map((id, idIndex) => idIndex)) {
                let validIdIndex: number = randomIndex + index;
                if (validIdIndex > validIds.length - 1) validIdIndex -= validIds.length;
                if (!this.stateGameService.idPlayed.includes(validIds[validIdIndex])) {
                    this.stateGameService.gameData.id = validIds[validIdIndex];
                    this.getGameData();
                    this.stateGameService.idPlayed.push(validIds[validIdIndex]);
                    this.stateGameService.idPlayedChanged.next(this.stateGameService.idPlayed);
                    if (this.stateGameService.isSinglePlayer()) {
                        this.stateGameService.time +=
                            this.stateGameService.gameConstants.find((constant) => constant.name === GAME_CONSTANTS_NAME.DISCOVER_TIME)?.time || 0;
                        if (this.stateGameService.time >= MAX_TIME) this.stateGameService.time = MAX_TIME;
                        this.stateGameService.timeChanged.next(this.stateGameService.time);
                    }
                    if (this.stateGameService.isMultiPlayer())
                        this.stateGameService.socketClient.socket.emit('loadNextTimedGame', this.stateGameService.room, validIds[validIdIndex]);
                    return;
                }
            }
            this.stateGameService.gameState = GAME_STATE.PLAYED_ALL_GAMES;
            this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
            this.stateGameService.socketClient.socket.emit('timedGameEnded', this.stateGameService.room);
            return;
        });
    }
}
