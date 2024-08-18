import { Injectable } from '@angular/core';
import { GAME_EVENTS, LAYERS, REPLAY_SPEED, TIME } from '@common/constants';
import { Difference, GameEvent } from '@common/interfaces';
import { CanvasGameService } from './game/canvas.game.service';
import { ChatGameService } from './game/chat.game.service';
import { HintService } from './game/hint.game.service';
import { StateGameService } from './game/state.game.service';
import { ValidationGameService } from './game/validation.game.service';

@Injectable({
    providedIn: 'root',
})
export class ReplayService {
    gameEvents: GameEvent[] = [];
    toDoEvents: GameEvent[] = [];
    intervalId: ReturnType<typeof setTimeout> = setTimeout(() => ({}));
    speed = TIME.REPLAY_TIME;
    time: number = 0;
    numberOfHints = 0;
    isPlaying = false;
    justEnded = true;
    hintTime = REPLAY_SPEED.HINT_DEFAULT_TIME;

    // Needed to access all the services of game
    // eslint-disable-next-line max-params
    constructor(
        private readonly stateService: StateGameService,
        private readonly canvasService: CanvasGameService,
        private readonly validationService: ValidationGameService,
        private readonly chatService: ChatGameService,
        private readonly hintService: HintService,
    ) {}

    play() {
        if (this.isPlaying) {
            return;
        }
        this.isPlaying = true;
        if (this.justEnded) {
            this.reset();
        }
        this.justEnded = false;
        const numberOfEventsPerSecond = 20;
        this.intervalId = setInterval(() => {
            this.time++;
            if (this.time % numberOfEventsPerSecond === numberOfEventsPerSecond - 1) {
                this.stateService.time++;
            }
            this.stateService.timeChanged.next(this.stateService.time);
            this.handleEvent();
        }, this.speed);
    }

    handleEvent() {
        if (this.toDoEvents[0].time > this.stateService.time) {
            return;
        }
        switch (this.toDoEvents[0].type) {
            case GAME_EVENTS.CHEAT_MODE: {
                this.canvasService.cheatMode();
                break;
            }
            case GAME_EVENTS.HINT: {
                const newChat = this.chatService.setHintUsed(this.stateService.time);
                this.chatService.addChatMessage(newChat);
                this.hintService.handleHint(
                    [
                        this.canvasService.originalLayersContexts.get(LAYERS.HINT) as CanvasRenderingContext2D,
                        this.canvasService.modifiedLayersContexts.get(LAYERS.HINT) as CanvasRenderingContext2D,
                    ],
                    [this.toDoEvents[0].eventData as Difference],
                );
                break;
            }
            case GAME_EVENTS.DIFFERENCE_FOUND: {
                for (const player of this.stateService.players) {
                    if (player.username === this.toDoEvents[0].eventData.username) {
                        player.differencesFound.push(this.toDoEvents[0].eventData.difference as Difference);
                        this.stateService.chatHistory = this.stateService.chatHistory.reverse();
                        this.stateService.chatHistory.push(
                            this.chatService.setFoundDifferences(this.toDoEvents[0].eventData.username, this.toDoEvents[0].time),
                        );
                        this.stateService.chatHistory = this.stateService.chatHistory.reverse();
                        this.stateService.chatHistoryChanged.next(this.stateService.chatHistory);
                        break;
                    }
                }
                this.stateService.playersChanged.next(this.stateService.players);
                break;
            }
            case GAME_EVENTS.ERROR: {
                this.validationService.invalidMoveMade(this.toDoEvents[0].eventData);
                break;
            }
            case GAME_EVENTS.END: {
                clearInterval(this.intervalId);
                this.toDoEvents = JSON.parse(JSON.stringify(this.gameEvents));
                this.isPlaying = false;
                this.justEnded = true;
                break;
            }
            case GAME_EVENTS.MESSAGE: {
                this.stateService.chatHistory.push(this.toDoEvents[0].eventData);
                this.stateService.chatHistoryChanged.next(this.stateService.chatHistory);
                break;
            }
        }
        this.toDoEvents.shift();
    }

    getData() {
        if (!this.stateService.gameEnded) {
            this.gameEvents = JSON.parse(JSON.stringify(this.stateService.replayEvents));
            this.toDoEvents = JSON.parse(JSON.stringify(this.gameEvents));
            this.numberOfHints = this.findNumberOfHints(this.gameEvents);
            this.speed = TIME.REPLAY_TIME;
            this.hintTime = this.hintService.timePenalty;
            this.reset();
        }
    }

    reset() {
        this.stateService.time = 0;
        this.stateService.chatHistory = [];
        this.stateService.chatHistoryChanged.next(this.stateService.chatHistory);
        this.stateService.players.forEach((player) => {
            player.differencesFound = [];
            player.invalidMoves = [];
        });
        this.hintService.reset();
        this.time = 0;
        this.stateService.timeChanged.next(this.stateService.time);
        this.canvasService.oldDifferenceFound = [];
        this.canvasService.replayReset();
    }

    stop() {
        this.isPlaying = false;
        clearInterval(this.intervalId);
    }

    changeSpeed(time: number) {
        const verifier = this.isPlaying;
        this.isPlaying = false;
        clearInterval(this.intervalId);
        this.speed = time;
        if (verifier) {
            this.play();
        }
    }

    replay() {
        const verifier = this.isPlaying;
        this.isPlaying = false;
        clearInterval(this.intervalId);
        this.toDoEvents = JSON.parse(JSON.stringify(this.gameEvents));
        this.reset();
        if (verifier) {
            this.play();
        }
    }

    getEndTime() {
        return this.gameEvents[this.gameEvents.length - 1].time;
    }

    percentOfTimePassed() {
        const numberOfEventsPerSecond = 20;
        const percent = 100;
        return Math.ceil((this.time / ((this.getEndTime() - this.numberOfHints * this.hintTime) * numberOfEventsPerSecond)) * percent);
    }

    findNumberOfHints(gameEvents: GameEvent[]) {
        return gameEvents.filter((gameEvent: GameEvent) => gameEvent.type === GAME_EVENTS.HINT).length;
    }
}
