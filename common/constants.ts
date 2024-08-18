import { CallbackSignature, Dimensions, GameConstants, HistoryData, UsersScore } from './interfaces';

export enum TIME {
    ONE_TENTH_SECOND = 100,
    HALF_SECOND = 500,
    QUARTER_SECOND = 250,
    ONE_SECOND = 1000,
    ONE_MINUTE = 60000,
    FIVE_MINUTES = 300000,
    MOVE_COOL_DOWN = 1000,
    FIVE_SECONDS = 5000,
    TEN_SECONDS = 10000,
    REPLAY_TIME = 50,
}

export enum REPLAY_SPEED {
    FASTER_2X = 2,
    FASTER_4X = 4,
    HINT_DEFAULT_TIME = 5,
}

export const DEFAULT_WIDTH = 640;
export const DEFAULT_HEIGHT = 480;
export const ERROR_MESSAGE_WIDTH = 110;
export const ERROR_MESSAGE_HEIGHT = 25;
export const DEFAULT_PEN_SIZE = 12;

export const VALID_FORMAT = 'image/bmp';
export const HEADER_LENGTH = 4;
export const HEADER_CONVERT_BASE = 16;
export const VALID_HEADER = '424d3610';
export const EMPTY_IMG_SRC: string = 'assets/image_empty.bmp';
export const DIFF_MIN = 3;
export const DIFF_MAX = 9;
export const HINT_WIDTH = 10;

export type CustomFile<T extends string, U> = {
    [K in T]: U;
};

export enum FILE_TYPE {
    originalImage = 'originalImage',
    modifiedImage = 'modifiedImage',
    imageJSON = 'imageJSON',
}

export const FILE_EXTENSION: CustomFile<FILE_TYPE, string> = {
    [FILE_TYPE.originalImage]: '.bmp',
    [FILE_TYPE.modifiedImage]: '.bmp',
    [FILE_TYPE.imageJSON]: '.json',
};

export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 16;
export const MINIMUM_GAME_AMOUNT = 2;

export enum COLOR {
    red = '#ff0000',
    green = '#008000',
    blue = '#0000ff',
    yellow = '#ffff00',
    pink = '#ff00ff',
    black = '#000000',
    white = '#ffffff',
    purple = '#800080',
    orange = '#ffa500',
}

export enum GAME_EVENTS {
    DIFFERENCE_FOUND = 'DifferenceFound',
    ERROR = 'Error',
    HINT = 'Hint',
    CHEAT_MODE = 'Cheat',
    MESSAGE = 'Message',
    END = 'End',
    START = 'Start',
    PLAYER_DATA_CHANGED = 'Player',
}

export const ENLARGE_OPTIONS: string[] = ['0', '3', '9', '15'];

export enum Quadrant {
    LEFT_UP = 1,
    RIGHT_UP = 2,
    LEFT_DOWN = 3,
    RIGHT_DOWN = 4,
}

export enum GAME_PLAYER_MODE {
    SINGLE_PLAYER = 'singlePlayer',
    MULTI_PLAYER = 'multiPlayer',
}

export enum CONFIG_CONSTANTS {
    INITIAL_TIME_MIN = 10,
    INITIAL_TIME_MAX = 120,
    PENALTY_TIME_MIN = 1,
    PENALTY_TIME_MAX = 30,
    DISCOVER_TIME_MIN = 3,
    DISCOVER_TIME_MAX = 30,
    SPEED = 100,
    DEFAULT_TIME = 10,
    INCREMENT = 1,
    DECREMENT = -1,
}

export enum GAME_TIMER_MODE {
    CLASSIC = 'classic',
    TIMED = 'timed',
}
export enum PAGE_TYPE {
    Selection,
    Configuration,
}

export const EMPTY_INDEX: number = -1;

export enum LAYERS {
    IMAGE = 'image',
    DIFFERENCE_FOUND = 'differenceFound',
    FLASH_DIFFERENCE = 'flashDifference',
    HINT = 'hint',
    ERROR = 'error',
    CURSOR = 'cursor',
}
export const FLASHES = 3;

export enum GAME_STATE {
    LOBBY = 'lobby',
    PRE_GAME = 'preGame',
    IN_GAME = 'inGame',
    WON_GAME = 'wonGame',
    LOST_GAME = 'lostGame',
    ABANDONING_GAME = 'abandoningGame',
    OUT_OF_GAMES = 'outOfGames',
    NO_MORE_TIME = 'noMoreTime',
    PLAYED_ALL_GAMES = 'playedAllGames',
    REPLAY = 'replay',
    OPPONENT_DISCONNECTED = 'opponentDisconnected',
}

export const NUMBER_CARDS_PER_PAGE = 4;

export enum CREATION_HEADER {
    LINK = '/config',
    TITLE = 'Création de jeu',
    ICON = 'close',
}
export const RESPONSE_DELAY = 200;

export const USERS_SOLO_RANKING: UsersScore[] = [
    { name: 'Enrito', time: 71 },
    { name: 'Enrique', time: 83 },
    { name: 'Enri', time: 92 },
];

export const USERS_1V1_RANKING: UsersScore[] = [
    { name: 'Bob', time: 131 },
    { name: 'Baba', time: 143 },
    { name: 'Bobo', time: 152 },
];

export const FIRST_HINT_DIMENSIONS: Dimensions = {
    width: DEFAULT_WIDTH / 2,
    height: DEFAULT_HEIGHT / 2,
};

export const SECOND_HINT_DIMENSIONS: Dimensions = {
    width: DEFAULT_WIDTH / 4,
    height: DEFAULT_HEIGHT / 4,
};

export enum GAME_CONSTANTS_NAME {
    INITIAL_TIME = 'Temps initial du compte à rebours',
    PENALTY_TIME = "Temps de pénalité pour l'utilisation d'un indice",
    DISCOVER_TIME = "Temps gagné avec la découverte d'une différence",
    MAX_TIME = 'Temps maximum pour une partie',
}
export const CONFIGURATION_GAME_CONSTANTS: GameConstants[] = [
    { name: GAME_CONSTANTS_NAME.INITIAL_TIME, time: 30 },
    { name: GAME_CONSTANTS_NAME.PENALTY_TIME, time: 5 },
    { name: GAME_CONSTANTS_NAME.DISCOVER_TIME, time: 5 },
];
export const MAX_TIME = 120;

export const DEFAULT_PLAYER_NAME: string = 'PLAYER';

export const DEFAULT_HISTORY_DATA: HistoryData = {
    date: 'date',
    duration: 0,
    mode: '',
    player1: { name: '', isWinner: false, isQuitter: false },
    player2: { name: '', isWinner: false, isQuitter: false },
};
export const BASE_TEN = 10;

export const CALLBACK: CallbackSignature = (params: any) => {};
