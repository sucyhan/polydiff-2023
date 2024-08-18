import { Injectable, OnDestroy } from '@angular/core';
import { PlayerData, Point } from '@common/interfaces';
import { Subscription } from 'rxjs';
import { StateGameService } from './state.game.service';
import { ValidationGameService } from './validation.game.service';

@Injectable({
    providedIn: 'root',
})
export class MouseGameService implements OnDestroy {
    startCoordinate: Point = { x: 0, y: 0 };
    players: PlayerData[] = [];
    playersSubscription: Subscription;
    canMakeMove: boolean = true;
    canMakeMoveSubscription: Subscription;

    constructor(private readonly stateGameService: StateGameService, private readonly validationGameService: ValidationGameService) {
        this.startCoordinate = { x: 0, y: 0 };
        this.players = this.stateGameService.players;
        this.playersSubscription = this.stateGameService.playersChanged.subscribe(() => {
            this.players = this.stateGameService.players;
        });
        this.canMakeMove = this.stateGameService.canMakeMove;
        this.canMakeMoveSubscription = this.stateGameService.canMakeMoveChanged.subscribe((canMakeMove: boolean) => {
            this.canMakeMove = canMakeMove;
        });
    }

    ngOnDestroy() {
        this.playersSubscription.unsubscribe();
        this.canMakeMoveSubscription.unsubscribe();
    }

    onMouseDown(coordinate: Point) {
        if (this.canMakeMove) {
            this.startCoordinate = coordinate;
            this.validationGameService.validateMove(coordinate);
        }
    }
}
