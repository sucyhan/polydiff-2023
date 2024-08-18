import { GAME_EVENTS, GAME_PLAYER_MODE, GAME_TIMER_MODE } from './constants';
export interface Point {
    x: number;
    y: number;
}

export interface Rectangle {
    point1: Point;
    point2: Point;
}

export interface Difference {
    rectangles: Rectangle[];
}

export interface ImageDiffs {
    differences: Point[][];
    difficulty: string;
}

export interface TimerObject {
    time: number;
    totalTime: number;
    gameMode: GAME_TIMER_MODE;
    isActive: boolean;
}

export interface UsersScore {
    name: string;
    time: number;
}

export interface GameConstants {
    name: string;
    time: number;
}
export interface GameRankings {
    gameId: number;
    singlePlayer: UsersScore[];
    multiPlayer: UsersScore[];
}

export interface UsernamesObject {
    usernames: string[];
    id: number;
}

export interface CanvasState {
    context1: ImageData;
    context2: ImageData;
}

export interface GameEvent {
    type: GAME_EVENTS;
    time: number;
    eventData: any;
}

export interface DifferenceEvent {
    difference: Difference;
    username: string;
}

export interface messageScoreInfo {
    position: number;
    gameName: string;
    mode: GAME_PLAYER_MODE;
}

export interface PlayerData {
    username: string;
    differencesFound: Difference[];
    invalidMoves: Point[];
}

export interface UserGame {
    username: string;
    socketId: string;
}

export interface GameRoom {
    room: string;
    id: number;
    users: UserGame[];
    players: PlayerData[];
    timer: TimerObject;
}

export interface UserWaiting {
    socketId: string;
    userName: string;
}

export interface WaitingRoom {
    creatorId: string;
    room: string;
    gameId: number;
    waitingLine: UserWaiting[];
}

export interface GameCardType {
    game: GameData;
    isAvailable: boolean;
}

export interface ClientWaitingObject {
    gameId: number;
    playerName: string;
    opponentName: string;
    creatorName: string;
    isCreator: boolean;
    newOpponent: boolean;
    isWaiting: boolean;
    waitingMessage: string;
}

export interface DisconnectMessage {
    gameId: number;
    typeOfUser: string;
    waitingLineIndex: number;
}

export interface IsUserPosition {
    isInLine: boolean;
    position: number;
}

export interface CanvasChanges {
    past: CanvasState[];
    next: CanvasState[];
}
export interface GameData {
    id: number;
    title: string;
    difficulty: string;
    numberOfDifferences: number;
    differences: Difference[];
    imageSrc?: string;
}

export interface ChatMessage {
    username: string;
    message: string;
    time: number;
    textColor: ChatColor;
    backgroundColor: ChatColor;
}
export interface ChatColor {
    r: number;
    g: number;
    b: number;
}

export interface Dimensions {
    width: number;
    height: number;
}

export interface DatabaseGame {
    gameId: number;
    singlePlayer: UsersScore[];
    multiPlayer: UsersScore[];
}
export interface HistoryData {
    date: string;
    duration: number;
    mode: string;
    player1: PlayerInfo;
    player2: PlayerInfo;
}

export interface PlayerInfo {
    name: string;
    isWinner: boolean;
    isQuitter: boolean;
}
export type CallbackSignature = (params: any) => void;

export type SocketParams = any;

export type PrivateFunction = any;
