import { GAME_PLAYER_MODE, GAME_TIMER_MODE, TIME } from '@common/constants';
import { ChatMessage, GameData, HistoryData, PlayerData, Point, UsersScore } from '@common/interfaces';
import { ValidMoveResponseMessage } from '@common/messages';
import * as io from 'socket.io';
import { GameRoomService } from './game-room.service';
import { HistoryService } from './history.service';
import { ScoreSortingService } from './score-sorting.service';
import { ValidationService } from './validation.service';

export class GameRoomHandler {
    interval: ReturnType<typeof setInterval> = setInterval(() => {
        this.gameRoomService.gameRooms.forEach((game) => {
            if (game.timer.isActive) this.emitTime(game.timer.time, `${game.id}-${game.room}`);
        });
        this.gameRoomService.timedGameRooms.forEach((game) => {
            if (game.timer.isActive) {
                if (game.timer.time <= 0) {
                    game.timer.time = 0;
                    game.timer.isActive = false;
                }
                this.emitTime(game.timer.time, `timed-${game.room}`);
            }
        });
    }, TIME.ONE_SECOND);
    sio: io.Server;
    // eslint-disable-next-line max-params
    constructor(
        private readonly gameRoomService: GameRoomService,
        private readonly validationService: ValidationService,
        private scoreSortingService: ScoreSortingService,
        private historyService: HistoryService,
    ) {}

    handleGameRoom(socket: io.Socket, sio: io.Server) {
        this.sio = sio;

        // disabled since we need all this info to be able to join the correct game
        // eslint-disable-next-line max-params
        socket.on('joinGame', (username: string, room: string, id: number, mode: GAME_TIMER_MODE) => {
            if (mode === GAME_TIMER_MODE.TIMED) {
                socket.join(`timed-${room}`);
                this.gameRoomService.joinGame(this.gameRoomService.getTimedGameRoom(id, room), username, socket.id);
                sio.to(`timed-${room}`).emit('updateGamePlayers', this.gameRoomService.getPlayerData(room, id, mode));
            } else {
                socket.join(`${id}-${room}`);
                this.gameRoomService.joinGame(this.gameRoomService.getGameRoom(id, room, mode), username, socket.id);
                sio.to(`${id}-${room}`).emit('updateGamePlayers', this.gameRoomService.getPlayerData(room, id, mode));
            }
        });

        socket.on('scoreEmit', async (data: [number, string, UsersScore, string]) => {
            if (await this.scoreSortingService.gameExists(data[0])) {
                const scores = await this.scoreSortingService.updateRanking(data[0], data[1], data[2]);
                sio.sockets.emit('newRecord', [data[0], data[1], scores]);
                if (scores[1] > 0) {
                    const chat: ChatMessage = this.gameRoomService.createNewRecordMessage(data[2], {
                        position: scores[1],
                        gameName: data[3],
                        mode: data[1] as GAME_PLAYER_MODE,
                    });
                    sio.sockets.emit('chatMessage', chat);
                }
            }
        });

        socket.on('resetGameScores', async (gameID: number) => {
            await this.scoreSortingService.resetGameScores(gameID);
            sio.sockets.emit('getAllScores', [gameID, await this.scoreSortingService.getGameScores(gameID)]);
        });

        socket.on('resetAllGames', async () => {
            await this.scoreSortingService.resetAll();
            sio.sockets.emit('resetAllGames');
        });

        socket.on('globalMessage', (chat: ChatMessage) => {
            socket.broadcast.emit('chatMessage', chat);
        });

        socket.on('leaveGameRoom', (room: string, id: number) => {
            socket.leave(`${id}-${room}`);
        });

        socket.on('getScores', async (data: [number, string]) => {
            const scores = await this.scoreSortingService.getScores(data[0], data[1]);
            socket.emit('getScores', scores);
        });

        socket.on('getAllScores', async (gameID: number) => {
            const gameRankings = await this.scoreSortingService.getGameScores(gameID);
            socket.emit('getAllScores', [gameID, gameRankings]);
        });

        // disabled since we need all this info to be able to update the correct game
        // eslint-disable-next-line max-params
        socket.on('updateGamePlayers', (players: PlayerData[], room: string, id: number, mode: GAME_TIMER_MODE) => {
            this.gameRoomService.updatePlayers(players, room, id, mode);
            sio.to(`${id}-${room}`).emit('updateGamePlayers', players);
        });

        socket.on('startTimer', (room: string, id: number, mode: GAME_TIMER_MODE) => {
            this.gameRoomService.startTimer(room, id, mode);
        });

        socket.on('stopTimer', (room: string, id: number, mode: GAME_TIMER_MODE) => {
            this.gameRoomService.stopTimer(room, id, mode);
        });

        socket.on('chatMessage', (chatMessage: ChatMessage, room: string, id: number) => {
            socket.broadcast.to(`${id}-${room}`).emit('chatMessage', chatMessage);
        });

        socket.on('timedChatMessage', (chatMessage: ChatMessage, room: string) => {
            socket.broadcast.to(`timed-${room}`).emit('chatMessage', chatMessage);
        });

        socket.on('loadNextTimedGame', (room: string, id: number) => {
            this.gameRoomService.addBonusTime(room);
            socket.broadcast.to(`timed-${room}`).emit('loadNextTimedGame', id);
        });

        socket.on('leaveGame', (room: string, id: number) => {
            this.gameRoomService.leaveGame(room, id, socket.id);
            socket.leave(`${id}-${room}`);
            socket.emit('leaveGame');
            sio.to(`${id}-${room}`).emit('playerLeft');
        });

        socket.on('leaveTimedGame', (room: string) => {
            this.gameRoomService.leaveTimedGame(room, socket.id);
            socket.leave(`timed-${room}`);
            socket.emit('leaveGame');
            sio.to(`timed-${room}`).emit('playerLeft');
        });

        socket.on('validateMove', (data: [Point, PlayerData[], GameData]) => {
            const message: ValidMoveResponseMessage = this.validationService.isValidMove(data[0], data[1], data[2]);
            if (message.valid) {
                socket.emit('validMoveMade', message.difference);
            } else {
                socket.emit('invalidMoveMade', data[0]);
            }
        });

        socket.on('timedGameEnded', (room: string) => {
            this.gameRoomService.leaveTimedGame(room, socket.id);
            socket.leave(`timed-${room}`);
            socket.broadcast.to(`timed-${room}`).emit('timedGameEnded');
            const game = this.gameRoomService.findTimedGame(room);
            if (game) {
                this.gameRoomService.timedGameRooms = this.gameRoomService.timedGameRooms.filter((timedGameRoom) => timedGameRoom !== game);
            }
        });
        socket.on('addGameHistory', async (data: HistoryData) => {
            await this.historyService.addHistory(data);
            sio.sockets.emit('updateHistory', await this.historyService.getHistory());
        });

        socket.on('getHistory', async () => {
            socket.emit('updateHistory', await this.historyService.getHistory());
        });

        socket.on('deleteHistory', async () => {
            await this.historyService.deleteHistory();
            sio.sockets.emit('updateHistory', []);
        });
    }

    disconnect(socket: io.Socket, sio: io.Server) {
        this.gameRoomService.gameRooms.forEach((game) => {
            const user = game.users.find((userSocket) => userSocket.socketId === socket.id);
            if (user) {
                for (const socketId of game.users.map((users) => users.socketId)) {
                    sio.to(socketId).emit('opponentDisconnected');
                }
                this.gameRoomService.gameRooms = this.gameRoomService.gameRooms.filter((room) => room !== game);
            }
        });
        this.gameRoomService.timedGameRooms.forEach((game) => {
            const user = game.users.find((userSocket) => userSocket.socketId === socket.id);
            if (user) {
                for (const socketId of game.users.map((users) => users.socketId)) {
                    sio.to(socketId).emit('opponentDisconnected');
                }
                this.gameRoomService.timedGameRooms = this.gameRoomService.timedGameRooms.filter((room) => room !== game);
            }
        });
    }

    emitTime(time: number, room: string) {
        this.sio.to(room).emit('clock', time);
    }
}
