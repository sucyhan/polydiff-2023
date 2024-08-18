import { GAME_CONSTANTS_NAME, GAME_PLAYER_MODE, GAME_TIMER_MODE, MAX_TIME, TIME } from '@common/constants';
import { ChatMessage, GameRoom, PlayerData, TimerObject, UsersScore, messageScoreInfo } from '@common/interfaces';
import { Service } from 'typedi';
import { ConstantsService } from './constants.service';

@Service()
export class GameRoomService {
    interval: ReturnType<typeof setInterval>;
    gameRooms: GameRoom[] = [];
    timedGameRooms: GameRoom[] = [];

    constructor(private readonly constantsService: ConstantsService) {
        this.interval = setInterval(() => {
            this.gameRooms.forEach((game) => {
                if (game.timer.isActive) {
                    game.timer.time++;
                }
            });
            this.timedGameRooms.forEach((game) => {
                if (game.timer.isActive) {
                    game.timer.time--;
                }
            });
        }, TIME.ONE_SECOND);
    }

    getGameRoom(id: number, room: string, mode: GAME_TIMER_MODE): GameRoom {
        let game = this.findGame(id, room, mode);
        if (!game) {
            game = this.createNewRoomObject(id, room);
            this.gameRooms.push(game);
        }
        return game;
    }

    getTimedGameRoom(id: number, room: string): GameRoom {
        let game = this.findTimedGame(room);
        if (!game) {
            game = this.createNewRoomObject(id, room);
            this.timedGameRooms.push(game);
        }
        return game;
    }
    findTimedGame(room: string) {
        return this.timedGameRooms.find((game) => game.room === room);
    }

    joinGame(gameRoom: GameRoom, username: string, socketId: string): boolean {
        if (gameRoom.users.find((user) => user.username === username)) return true;
        if (gameRoom.users.length >= 2) return false;
        const player = this.usernameToNewPlayerData(username);
        gameRoom.players.push(player);
        gameRoom.users.push({ socketId, username });
        return true;
    }

    // disabled since we need all this info to update the correct game
    // eslint-disable-next-line max-params
    updatePlayers(players: PlayerData[], room: string, id: number, mode: GAME_TIMER_MODE): void {
        const game = this.findGame(id, room, mode);
        if (game) {
            game.players = players;
        }
    }

    stopTimer(room: string, id: number, mode: GAME_TIMER_MODE): void {
        const game = this.findGame(id, room, mode);
        if (game) {
            game.timer.isActive = false;
        }
    }

    startTimer(room: string, id: number, mode: GAME_TIMER_MODE): void {
        const game = this.findGame(id, room, mode);
        if (game) {
            if (mode === GAME_TIMER_MODE.TIMED) {
                game.timer.time =
                    this.constantsService.gameConstants.find((constant) => constant.name === GAME_CONSTANTS_NAME.INITIAL_TIME)?.time || 0;
            }
            game.timer.isActive = true;
            game.timer.gameMode = mode;
        }
    }

    getPlayerData(room: string, id: number, mode: GAME_TIMER_MODE): PlayerData[] | void {
        const game = this.findGame(id, room, mode);
        if (game) {
            return game.players;
        }
    }

    findGame(id: number, room: string, mode: GAME_TIMER_MODE): GameRoom | undefined {
        if (mode === GAME_TIMER_MODE.TIMED) {
            return this.timedGameRooms.find((game) => game.room === room);
        }
        return this.gameRooms.filter((game) => game.id === id).find((game) => game.room === room);
    }

    usernameToNewPlayerData(username: string): PlayerData {
        return { username, differencesFound: [], invalidMoves: [] };
    }

    createNewRoomObject(id: number, room: string): GameRoom {
        return { id, room, players: [], timer: this.createNewTimerObject(), users: [] };
    }

    createNewTimerObject(): TimerObject {
        return { time: 0, isActive: true, totalTime: 0, gameMode: GAME_TIMER_MODE.CLASSIC };
    }

    leaveGame(room: string, id: number, socketId: string): void {
        const game = this.findGame(id, room, GAME_TIMER_MODE.CLASSIC);
        if (game) {
            const username = game.users.find((user) => user.socketId === socketId)?.username;
            game.players = game.players.filter((player) => player.username !== username);
            game.users = game.users.filter((user) => user.socketId !== socketId);
        }
        this.leaveTimedGame(room, socketId);
    }
    leaveTimedGame(room: string, socketId: string): void {
        const game = this.findTimedGame(room);
        if (game) {
            const username = game.users.find((user) => user.socketId === socketId)?.username;
            game.players = game.players.filter((player) => player.username !== username);
            game.users = game.users.filter((user) => user.socketId !== socketId);
        }
    }
    addBonusTime(room: string) {
        const game = this.findTimedGame(room);
        if (game) {
            game.timer.time += this.constantsService.gameConstants.find((constant) => constant.name === GAME_CONSTANTS_NAME.DISCOVER_TIME)?.time || 0;
            if (game.timer.time > MAX_TIME) {
                game.timer.time = MAX_TIME;
            }
        }
    }

    createNewRecordMessage(userScore: UsersScore, info: messageScoreInfo) {
        const chat: ChatMessage = {
            username: '',
            message: `${userScore.name} obtient la ${info.position} place dans les meilleurs temps du jeu ${info.gameName} en ${
                info.mode === GAME_PLAYER_MODE.SINGLE_PLAYER ? 'mode solo' : 'mode multijoueur'
            }`,
            time: userScore.time,
            textColor: { r: 255, g: 165, b: 0 },
            backgroundColor: { r: 255, g: 255, b: 255 },
        };
        return chat;
    }
}
