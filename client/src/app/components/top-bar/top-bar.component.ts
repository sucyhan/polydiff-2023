import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_PLAYER_MODE, GAME_STATE, GAME_TIMER_MODE } from '@common/constants';
import { GameData, PlayerData } from '@common/interfaces';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
})
export class TopBarComponent implements OnInit, OnDestroy {
    players: PlayerData[] = [];
    playersSubscription: Subscription;
    time: number = 0;
    timeSubscription: Subscription;
    playerMode: GAME_PLAYER_MODE = GAME_PLAYER_MODE.SINGLE_PLAYER;
    playerModeSubscription: Subscription;
    timerMode: GAME_TIMER_MODE = GAME_TIMER_MODE.CLASSIC;
    timerModeSubscription: Subscription;
    gameData: GameData = { id: 0, title: '', difficulty: '', numberOfDifferences: 0, differences: [] };
    gameDataSubscription: Subscription;
    idPlayed: number[] = [];
    idPlayedSubscription: Subscription;
    constructor(private readonly stateGameService: StateGameService, private readonly cdr: ChangeDetectorRef) {}
    ngOnInit(): void {
        this.players = this.stateGameService.players;
        this.playersSubscription = this.stateGameService.playersChanged.subscribe(() => {
            this.players = this.stateGameService.players;
        });
        this.time = this.stateGameService.time;
        this.timeSubscription = this.stateGameService.timeChanged.subscribe((time: number) => {
            this.time = time;
        });
        this.playerMode = this.stateGameService.playerMode;
        this.playerModeSubscription = this.stateGameService.playerModeChanged.subscribe(() => {
            this.playerMode = this.stateGameService.playerMode;
        });
        this.timerMode = this.stateGameService.timerMode;
        this.timerModeSubscription = this.stateGameService.timerModeChanged.subscribe(() => {
            this.timerMode = this.stateGameService.timerMode;
        });
        this.gameData = this.stateGameService.gameData;
        this.gameDataSubscription = this.stateGameService.gameDataChanged.subscribe(() => {
            this.gameData = this.stateGameService.gameData;
        });
        this.idPlayedSubscription = this.stateGameService.idPlayedChanged.subscribe(() => {
            this.idPlayed = this.stateGameService.idPlayed;
            this.cdr.detectChanges();
        });
    }

    abandon() {
        this.stateGameService.gameState = GAME_STATE.ABANDONING_GAME;
        this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
    }

    ngOnDestroy(): void {
        this.playersSubscription.unsubscribe();
        this.timeSubscription.unsubscribe();
        this.playerModeSubscription.unsubscribe();
        this.timerModeSubscription.unsubscribe();
        this.gameDataSubscription.unsubscribe();
        this.idPlayedSubscription.unsubscribe();
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
    ceil(value: number): number {
        return Math.ceil(value);
    }
}
