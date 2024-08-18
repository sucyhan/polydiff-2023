import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { DEFAULT_PLAYER_NAME, FILE_TYPE, GAME_PLAYER_MODE, GAME_STATE, GAME_TIMER_MODE } from '@common/constants';
import { ChatMessage, Difference, GameConstants, GameData, PlayerData, Point } from '@common/interfaces';
import { ValidIdsMessage } from '@common/messages';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChatGameService } from './chat.game.service';
import { StateGameService } from './state.game.service';
import { TimerGameService } from './timer.game.service';
import { ValidationGameService } from './validation.game.service';
@Injectable({
    providedIn: 'root',
})
export class ControllerGameService implements OnDestroy {
    showVideoBar: Subject<boolean> = new Subject<boolean>();
    private readonly storageUrl: string = environment.serverUrl + '/storage';
    // Service injection
    // eslint-disable-next-line max-params
    constructor(
        private readonly stateGameService: StateGameService,
        private readonly validationGameService: ValidationGameService,
        private readonly timerGameService: TimerGameService,
        private readonly chatGameService: ChatGameService,
    ) {
        this.stateGameService.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.setUp(event.url);
            }
        });
    }

    setUp(url: string) {
        const activeUrl = url.split('/').filter((urlSubPath) => urlSubPath !== '');
        if (!this.setPlayerMode(activeUrl[1])) return;
        if (!this.setTimerMode(activeUrl[0])) return;
        if (this.stateGameService.timerMode === GAME_TIMER_MODE.TIMED) {
            if (this.stateGameService.playerMode === GAME_PLAYER_MODE.SINGLE_PLAYER) {
                this.setUsername(activeUrl[2]);
            }
            if (this.stateGameService.playerMode === GAME_PLAYER_MODE.MULTI_PLAYER) {
                this.setUsername(activeUrl[3]);
                this.setRoom(activeUrl[2]);
            }
            return;
        }
        this.setId(activeUrl[2]);
        if (this.stateGameService.playerMode === GAME_PLAYER_MODE.MULTI_PLAYER) {
            this.stateGameService.players = [];
            this.setUsername(activeUrl[4]);
            this.setRoom(activeUrl[3]);
        }
        this.getGameData();
        this.stateGameService.startDate = new Date();
        this.timerGameService.stopTimer();
        this.timerGameService.startTimer();
        this.updateService();
    }

    setUsername(urlSubPath: string) {
        this.stateGameService.currentPlayerUsername = urlSubPath;
        this.stateGameService.currentPlayerUsernameChanged.next(this.stateGameService.currentPlayerUsername);
    }

    setId(urlSubPath: string) {
        this.stateGameService.gameData.id = Number(urlSubPath);
        this.stateGameService.gameDataChanged.next(this.stateGameService.gameData);
    }

    setRoom(urlSubPath: string) {
        this.stateGameService.room = urlSubPath;
        this.stateGameService.roomChanged.next(this.stateGameService.room);
    }

    setPlayerMode(urlSubPath: string) {
        switch (urlSubPath) {
            case 'multiPlayer':
                this.stateGameService.playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
                this.stateGameService.playerModeChanged.next(this.stateGameService.playerMode);
                return true;
            case 'singlePlayer':
                this.stateGameService.playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
                this.stateGameService.playerModeChanged.next(this.stateGameService.playerMode);
                this.stateGameService.currentPlayerUsername = DEFAULT_PLAYER_NAME;
                this.stateGameService.currentPlayerUsernameChanged.next(this.stateGameService.currentPlayerUsername);
                this.stateGameService.players = [
                    {
                        username: DEFAULT_PLAYER_NAME,
                        differencesFound: [],
                        invalidMoves: [],
                    },
                ];
                this.stateGameService.playersChanged.next(this.stateGameService.players);
                return true;
            default:
                return false;
        }
    }
    setTimerMode(urlSubPath: string) {
        switch (urlSubPath) {
            case 'timed':
                this.stateGameService.timerMode = GAME_TIMER_MODE.TIMED;
                this.stateGameService.timerModeChanged.next(this.stateGameService.timerMode);
                if (this.stateGameService.playerMode === GAME_PLAYER_MODE.MULTI_PLAYER) this.loadInitialTimedGame();
                if (this.stateGameService.playerMode === GAME_PLAYER_MODE.SINGLE_PLAYER) this.setRandomIdAndLoadGame();
                return true;
            case 'classic':
                this.stateGameService.timerMode = GAME_TIMER_MODE.CLASSIC;
                this.stateGameService.timerModeChanged.next(this.stateGameService.timerMode);
                return true;
            default:
                return false;
        }
    }

    navigate(relativeURL: string) {
        this.stateGameService.router.navigate([relativeURL]);
    }

    reloadPage(): void {
        const currentPageURL = this.stateGameService.router.url;
        this.stateGameService.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(async () => this.stateGameService.router.navigate([currentPageURL]));
    }

    leaveGame() {
        if (this.stateGameService.playerMode === GAME_PLAYER_MODE.MULTI_PLAYER) {
            this.stateGameService.socketClient.socket.emit('leaveGame', this.stateGameService.room);
        }
        this.stateGameService.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(async () => this.stateGameService.router.navigate(['/home']));
    }

    replayVideo() {
        this.stateGameService.gameState = GAME_STATE.REPLAY;
        this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
        this.showVideoBar.next(true);
        this.timerGameService.stopTimer();
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

    handleSocket() {
        this.stateGameService.socketClient.connect();
        this.stateGameService.socketClient.on('updateGamePlayers', (players: PlayerData[]) => {
            this.stateGameService.players = players;
            this.stateGameService.playersChanged.next(players);
            if (this.stateGameService.isClassic()) this.validationGameService.endGameCheck();
        });
        this.stateGameService.socketClient.on('clock', (time: number) => {
            this.stateGameService.time = time;
            this.stateGameService.timeChanged.next(this.stateGameService.time);
            if (this.stateGameService.isTimed()) this.timerGameService.endTimedGameCheck();
        });
        this.stateGameService.socketClient.on('chatMessage', (chat: ChatMessage) => {
            this.chatGameService.addChatMessage(chat);
        });
        this.stateGameService.socketClient.on('playerLeft', (username: string) => {
            if (this.stateGameService.isTimed()) {
                const time = this.stateGameService.time;
                this.timerGameService.stopTimer();
                this.stateGameService.socketClient.socket.emit('leaveTimedGame', this.stateGameService.room, this.stateGameService.gameData.id);
                this.stateGameService.playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
                this.timerGameService.startTimer();
                this.stateGameService.time = time;
                return;
            }
            this.timerGameService.stopTimer();
            this.forceWin();
            if (this.stateGameService.currentPlayerUsername === username) {
                this.reset();
                this.navigate('/home');
            }
        });

        this.stateGameService.socketClient.on('opponentDisconnected', () => {
            if (this.stateGameService.isTimed()) {
                const time = this.stateGameService.time;
                this.timerGameService.stopTimer();
                this.stateGameService.socketClient.socket.emit('leaveTimedGame', this.stateGameService.room, this.stateGameService.gameData.id);
                this.stateGameService.playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
                this.timerGameService.startTimer();
                this.stateGameService.time = time;
                return;
            }
            this.timerGameService.stopTimer();
            this.forceWin();
        });
        this.stateGameService.socketClient.on('validMoveMade', (difference: Difference) => {
            this.validationGameService.validMoveMade(difference);
        });
        this.stateGameService.socketClient.on('invalidMoveMade', (coordinate: Point) => {
            this.validationGameService.invalidMoveMade(coordinate);
        });

        this.stateGameService.socketClient.on('constant', (constants: GameConstants[]) => {
            if (this.stateGameService.gameState === GAME_STATE.IN_GAME) return;
            this.stateGameService.gameConstants = constants;
            this.stateGameService.gameConstantsChanged.next(constants);
        });

        this.stateGameService.socketClient.on('loadConstant', (constants: GameConstants[]) => {
            this.stateGameService.gameConstants = constants;
            this.stateGameService.gameConstantsChanged.next(constants);
        });

        this.stateGameService.socketClient.send('getConstant');
        if (this.stateGameService.playerMode === GAME_PLAYER_MODE.MULTI_PLAYER) {
            this.stateGameService.socketClient.socket.emit(
                'joinGame',
                this.stateGameService.currentPlayerUsername,
                this.stateGameService.room,
                this.stateGameService.gameData.id,
                this.stateGameService.timerMode,
            );
        }
        this.stateGameService.socketClient.on('loadNextTimedGame', (id: number) => {
            this.stateGameService.gameData.id = id;
            this.stateGameService.gameDataChanged.next(this.stateGameService.gameData);
            this.stateGameService.idPlayed.push(id);
            this.stateGameService.idPlayedChanged.next(this.stateGameService.idPlayed);
            this.getGameData();
        });

        this.stateGameService.socketClient.on('timedGameEnded', () => {
            this.stateGameService.gameState = GAME_STATE.PLAYED_ALL_GAMES;
            this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
            this.timerGameService.stopTimer();
        });
    }

    updateService() {
        this.timerGameService.stopTimer();
        this.getGameData();
        this.reset();
        this.timerGameService.startTimer();
    }

    reset() {
        this.stateGameService.time = 0;
        this.stateGameService.timeChanged.next(this.stateGameService.time);
        this.stateGameService.chatHistory = [];
        this.stateGameService.chatHistoryChanged.next(this.stateGameService.chatHistory);
        this.stateGameService.gameState = GAME_STATE.IN_GAME;
        this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
        this.stateGameService.players.forEach((player) => {
            player.differencesFound = [];
            player.invalidMoves = [];
        });
        this.stateGameService.opponentQuit = false;
        this.stateGameService.canMakeMove = true;
        this.stateGameService.canMakeMoveChanged.next(this.stateGameService.canMakeMove);
    }

    forceWin() {
        this.stateGameService.gameState = GAME_STATE.OPPONENT_DISCONNECTED;
        this.findOpponentUsername();
        this.stateGameService.chatHistory.push(
            this.chatGameService.setDisconnectedPlayer(this.stateGameService.opponentUsername, this.stateGameService.time),
        );
        this.stateGameService.opponentQuit = true;
        this.stateGameService.chatHistoryChanged.next(this.stateGameService.chatHistory);
        this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
    }
    findOpponentUsername() {
        this.stateGameService.players.forEach((player) => {
            if (player.username !== this.stateGameService.currentPlayerUsername) {
                this.stateGameService.opponentUsername = player.username;
            }
        });
    }
    abandonGame() {
        if (this.stateGameService.playerMode === GAME_PLAYER_MODE.MULTI_PLAYER) {
            if (this.stateGameService.isTimed())
                this.stateGameService.socketClient.socket.emit('leaveTimedGame', this.stateGameService.room, this.stateGameService.gameData.id);
            else this.stateGameService.socketClient.socket.emit('leaveGame', this.stateGameService.room, this.stateGameService.gameData.id);
        }
        this.reset();
        this.navigate('/home');
    }

    ngOnDestroy(): void {
        this.stateGameService.socketClient.disconnect();
    }

    loadInitialTimedGame() {
        this.stateGameService.startDate = new Date();
        this.getGameData();
        this.reset();
        this.timerGameService.stopTimer();
        this.timerGameService.startTimer();
        this.stateGameService.idPlayed = [this.stateGameService.gameData.id];
        this.stateGameService.idPlayedChanged.next([this.stateGameService.gameData.id]);
        this.stateGameService.players
            .filter((player) => player.username === DEFAULT_PLAYER_NAME)
            .forEach((player) => {
                player.username = this.stateGameService.currentPlayerUsername;
            });
    }
    setRandomIdAndLoadGame() {
        this.stateGameService.http.get<ValidIdsMessage>(`${this.storageUrl}/getValidIds`).subscribe((data: ValidIdsMessage) => {
            const validIds: number[] = data.validIds;
            const randomIndex: number = Math.floor(Math.random() * validIds.length);
            this.stateGameService.gameData.id = validIds[randomIndex];
            this.loadInitialTimedGame();
        });
    }
}
