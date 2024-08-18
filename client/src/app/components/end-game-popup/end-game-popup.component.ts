import { formatDate } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { GAME_PLAYER_MODE, GAME_STATE, TIME, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERS_1V1_RANKING } from '@common/constants';
import { GameData, HistoryData, UsersScore } from '@common/interfaces';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-end-game-popup',
    templateUrl: './end-game-popup.component.html',
    styleUrls: ['./end-game-popup.component.scss'],
})
export class EndGamePopupComponent implements OnInit, OnDestroy {
    showPopup: boolean = false;
    gameStateSubscription: Subscription;
    gameData: GameData = { id: 0, title: '', difficulty: '', numberOfDifferences: 0, differences: [] };
    gameDataSubscription: Subscription;
    imgSrc: string = 'assets/winner.png';
    time: number = 0;
    timeSubscription: Subscription;
    showUsernameMessage: boolean = false;
    submittedTimeToServer: boolean = false;
    placementPosition: string = '0';
    usernameInputForm: FormGroup<{ username: FormControl<string | null> }> = this.formBuilder.group({
        username: '',
    });
    usernameMessage: string = '';
    endTitle: string = '';
    endMessage: string = '';
    winnerUsername: string = '';
    idPlayed: number[] = [];
    idPlayedSubscription: Subscription;
    currentPlayerUsername: string = this.stateGameService.currentPlayerUsername;
    playedAllGames: boolean = false;

    secondPlayer: string = '';
    gameMode: string = '';
    gamePlayerMode: string = '';
    leaderBoard = USERS_1V1_RANKING;
    numberOfSends = 0;
    // Service injection
    // eslint-disable-next-line max-params
    constructor(
        private readonly stateGameService: StateGameService,
        private formBuilder: FormBuilder,
        private readonly controllerGameService: ControllerGameService,
        public socketSender: SocketClientService,
        private readonly storageService: StorageService,
    ) {
        socketSender.connect();
    }

    get username(): string {
        if (this.usernameInputForm.value != null) return this.usernameInputForm.value.username ? this.usernameInputForm.value.username : '';
        return '';
    }

    leaveGame() {
        this.controllerGameService.leaveGame();
    }

    replayGame() {
        if (this.isSinglePlayer()) {
            const verifier = confirm('Voulez vous lancer la reprise? Envoyez votre score avant');
            if (verifier) {
                this.showPopup = false;
                this.controllerGameService.replayVideo();
            }
            return;
        }
        this.showPopup = false;
        this.controllerGameService.replayVideo();
    }

    playAgain() {
        this.controllerGameService.reloadPage();
    }

    sendScore() {
        if (this.verifyUsername()) {
            this.stateGameService.currentPlayerUsername = this.username;
            this.usernameMessage = 'Temps soumis!';
            this.submittedTimeToServer = true;
            const scoreToSend: UsersScore = { name: this.username, time: this.time };
            this.socketSender.send('scoreEmit', [this.gameData.id, this.gamePlayerMode, scoreToSend, this.gameData.title]);
            this.showUsernameMessage = true;
            this.updateHistory();
        }
    }

    verifyUsername(): boolean {
        return !(this.username.length < USERNAME_MIN_LENGTH || this.username.length > USERNAME_MAX_LENGTH);
    }

    verifyKeyPress(event: KeyboardEvent) {
        if (/[a-zA-Z0-9]/.test(event.key)) {
            return true;
        } else {
            event.preventDefault();
            return false;
        }
    }

    ngOnInit(): void {
        this.time = this.stateGameService.time;
        this.timeSubscription = this.stateGameService.timeChanged.subscribe((time: number) => {
            this.time = time;
        });
        this.gameData = this.stateGameService.gameData;
        this.gameDataSubscription = this.stateGameService.gameDataChanged.subscribe((gameData: GameData) => {
            this.gameData = gameData;
        });
        this.gameStateSubscription = this.stateGameService.gameStateChanged.subscribe((gameState: GAME_STATE) => {
            this.checkIfGameIsOver(gameState);
        });
        this.idPlayed = this.stateGameService.idPlayed;
        this.idPlayedSubscription = this.stateGameService.idPlayedChanged.subscribe(() => {
            this.idPlayed = this.stateGameService.idPlayed;
        });
        this.gameMode = this.isClassic() ? 'Classique' : 'Temps limité';
        this.gamePlayerMode = this.isSinglePlayer() ? GAME_PLAYER_MODE.SINGLE_PLAYER : GAME_PLAYER_MODE.MULTI_PLAYER;
        this.socketSender.on('getScores', (newRecord: UsersScore[]) => {
            this.leaderBoard = newRecord;
        });
        this.socketSender.on('newRecord', (data: [number, string, [UsersScore[], number]]) => {
            this.leaderBoard = data[2][0];
            this.placementPosition = data[2][1].toString();
            if (data[2][1] < 1) {
                this.placementPosition = 'Pas classifié';
            }
        });
        this.socketSender.send('getScores', [this.gameData.id, this.gamePlayerMode]);
    }

    ngOnDestroy(): void {
        this.timeSubscription.unsubscribe();
        this.gameDataSubscription.unsubscribe();
        this.gameStateSubscription.unsubscribe();
        this.idPlayedSubscription.unsubscribe();
        this.numberOfSends = 0;
    }
    isSinglePlayer(): boolean {
        return this.stateGameService.isSinglePlayer();
    }
    isMultiPlayer(): boolean {
        return this.stateGameService.isMultiPlayer();
    }
    isClassic(): boolean {
        return this.stateGameService.isClassic();
    }
    isTimed(): boolean {
        return this.stateGameService.isTimed();
    }

    checkIfGameIsOver(gameState: GAME_STATE) {
        if (gameState === GAME_STATE.WON_GAME) {
            this.stateGameService.endDate = new Date();
            this.numberOfSends++;
            this.endTitle = 'Victoire!';
            this.endMessage = 'Félicitations, vous avez gagné!';
            this.imgSrc = 'assets/winner.png';
            this.showPopup = true;
            this.winnerUsername = this.stateGameService.currentPlayerUsername;
            if (this.isMultiPlayer() && this.numberOfSends <= 1) {
                this.findSecondPlayer();
                this.updateHistory();
                const scoreToSend: UsersScore = { name: this.stateGameService.currentPlayerUsername, time: this.stateGameService.time };
                this.socketSender.send('scoreEmit', [this.stateGameService.gameData.id, this.stateGameService.playerMode, scoreToSend]);
            }
            this.storageService.getScore(this.gameData.id, this.gamePlayerMode).subscribe((res: UsersScore[]) => {
                this.leaderBoard = res;
            });
        } else if (gameState === GAME_STATE.LOST_GAME) {
            this.endTitle = 'Défaite!';
            this.endMessage = 'Malheureusement, vous avez perdu...';
            this.imgSrc = 'assets/sad-pepe.png';
            this.showPopup = true;
            this.findWinnerUsername();
        }
        if (gameState === GAME_STATE.PLAYED_ALL_GAMES) {
            this.stateGameService.endDate = new Date();
            this.playedAllGames = true;
            this.endTitle = 'Victoire!';
            this.endMessage = 'Vous avez joué tous les jeux disponibles!';
            this.imgSrc = 'assets/running_frog.png';
            this.showPopup = true;
            this.updateHistory();
        }
        if (gameState === GAME_STATE.NO_MORE_TIME) {
            this.stateGameService.endDate = new Date();
            this.endTitle = 'Temps écoulé!';
            this.endMessage = "Vous n'avez plus de temps...";
            this.imgSrc = 'assets/frog_clock.png';
            this.showPopup = true;
            this.updateHistory();
        }
        if (gameState === GAME_STATE.OUT_OF_GAMES) {
            this.stateGameService.endDate = new Date();
            this.endTitle = 'Plus de jeux!';
            this.endMessage = "Il n'y a plus de jeux disponibles!";
            this.imgSrc = 'assets/sad-pepe.png';
            this.showPopup = true;
            this.updateHistory();
        }
        if (gameState === GAME_STATE.OPPONENT_DISCONNECTED) {
            this.endTitle = 'Bravo!';
            this.endMessage = "Votre adversaire s'est déconnecté!";
            this.imgSrc = 'assets/winner.png';
            this.showPopup = true;
            this.winnerUsername = this.stateGameService.currentPlayerUsername;
            this.storageService.getScore(this.gameData.id, this.gamePlayerMode).subscribe((res: UsersScore[]) => {
                this.leaderBoard = res;
            });
        }
    }

    findWinnerUsername() {
        this.stateGameService.players.forEach((player) => {
            if (player.username !== this.stateGameService.currentPlayerUsername) {
                this.winnerUsername = player.username;
            }
        });
    }

    findSecondPlayer() {
        this.stateGameService.players.forEach((player) => {
            if (player.username !== this.stateGameService.currentPlayerUsername) {
                this.secondPlayer = player.username;
            }
        });
    }

    updateHistory() {
        const historyData: HistoryData = {
            date: this.formatDate(this.stateGameService.startDate),
            duration: this.getRealDuration(),
            mode: this.gameMode,
            player1: { name: '', isWinner: true, isQuitter: false },
            player2: { name: '', isWinner: false, isQuitter: this.stateGameService.opponentQuit },
        };
        if (this.isClassic()) {
            if (this.isSinglePlayer()) {
                historyData.player1.isWinner = true;
                historyData.player1.name = this.username;
            } else {
                historyData.player1.name = this.winnerUsername;
                historyData.player2.name = this.secondPlayer;
            }
        } else {
            historyData.player1.name = this.stateGameService.players[0].username;
            historyData.player1.isWinner = true;
            if (this.isMultiPlayer()) {
                historyData.player2.name = this.stateGameService.players[1].username;
                historyData.player2.isWinner = false;
            }
        }

        this.socketSender.send('addGameHistory', historyData);
    }

    private formatDate(date: Date): string {
        return formatDate(date, 'yyyy-MM-dd hh:mm:ss', 'en-US');
    }

    private getRealDuration(): number {
        return (this.stateGameService.endDate.getTime() - this.stateGameService.startDate.getTime()) / TIME.ONE_SECOND;
    }
}
