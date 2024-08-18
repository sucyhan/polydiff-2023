import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_STATE } from '@common/constants';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-abandon-popup',
    templateUrl: './abandon-popup.component.html',
    styleUrls: ['./abandon-popup.component.scss'],
})
export class AbandonPopupComponent implements OnInit, OnDestroy {
    @Input() showPopup: boolean = false;

    gameState: GAME_STATE;
    gameStateSubscription: Subscription;

    abandonMessage: string = 'Êtes-vous sûr de vouloir abandonner la partie ?';

    constructor(private readonly stateGameService: StateGameService, private readonly controllerGameService: ControllerGameService) {}
    abandon() {
        this.controllerGameService.abandonGame();
    }
    hideAbandon() {
        this.showPopup = false;
    }

    ngOnInit(): void {
        this.gameState = this.stateGameService.gameState;
        this.gameStateSubscription = this.stateGameService.gameStateChanged.subscribe(() => {
            this.gameState = this.stateGameService.gameState;
            if (this.gameState === GAME_STATE.ABANDONING_GAME) {
                this.showPopup = true;
            }
            if (this.gameState === GAME_STATE.REPLAY || this.gameState === GAME_STATE.WON_GAME || this.gameState === GAME_STATE.LOST_GAME) {
                this.abandonMessage = 'Vouliez-vous quitter la reprise ?';
            }
        });
    }
    ngOnDestroy(): void {
        this.gameStateSubscription.unsubscribe();
    }
}
