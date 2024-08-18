import { Injectable } from '@angular/core';
import { GAME_CONSTANTS_NAME, GAME_STATE, TIME } from '@common/constants';
import { StateGameService } from './state.game.service';

@Injectable({
    providedIn: 'root',
})
export class TimerGameService {
    soloTimerInterval: ReturnType<typeof setInterval>;
    constructor(private readonly stateGameService: StateGameService) {}
    startTimer() {
        clearInterval(this.soloTimerInterval);
        if (this.stateGameService.isClassic()) {
            if (this.stateGameService.isSinglePlayer()) {
                this.soloTimerInterval = setInterval(() => {
                    this.stateGameService.time++;
                    this.stateGameService.timeChanged.next(this.stateGameService.time);
                }, TIME.ONE_SECOND);
            } else if (this.stateGameService.isMultiPlayer()) {
                this.stateGameService.socketClient.socket.emit(
                    'startTimer',
                    this.stateGameService.room,
                    this.stateGameService.gameData.id,
                    this.stateGameService.timerMode,
                );
            }
        } else if (this.stateGameService.isTimed()) {
            this.stateGameService.time =
                this.stateGameService.gameConstants.find((constant) => constant.name === GAME_CONSTANTS_NAME.INITIAL_TIME)?.time || 0;
            this.stateGameService.timeChanged.next(this.stateGameService.time);
            if (this.stateGameService.isSinglePlayer()) {
                this.soloTimerInterval = setInterval(() => {
                    this.stateGameService.time--;
                    this.stateGameService.timeChanged.next(this.stateGameService.time);
                    this.endTimedGameCheck();
                }, TIME.ONE_SECOND);
            } else if (this.stateGameService.isMultiPlayer()) {
                this.stateGameService.socketClient.socket.emit(
                    'startTimer',
                    this.stateGameService.room,
                    this.stateGameService.gameData.id,
                    this.stateGameService.timerMode,
                );
            }
        }
    }
    stopTimer() {
        clearInterval(this.soloTimerInterval);
        if (this.stateGameService.isMultiPlayer())
            this.stateGameService.socketClient.socket.emit('stopTimer', this.stateGameService.room, this.stateGameService.gameData.id);
    }
    endTimedGameCheck() {
        if (this.stateGameService.time <= 0) {
            this.stopTimer();
            this.stateGameService.gameState = GAME_STATE.NO_MORE_TIME;
            this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
            return;
        }
    }
}
