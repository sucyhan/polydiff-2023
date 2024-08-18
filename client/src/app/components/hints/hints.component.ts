import { AfterViewInit, Component } from '@angular/core';
import { CanvasGameService } from '@app/services/game/canvas.game.service';
import { HintService } from '@app/services/game/hint.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { GAME_CONSTANTS_NAME, GAME_STATE } from '@common/constants';

@Component({
    selector: 'app-hints',
    templateUrl: './hints.component.html',
    styleUrls: ['./hints.component.scss'],
})
export class HintsComponent implements AfterViewInit {
    numberHintUsed: number = 0;
    hideFirst: boolean = false;
    hideSecond: boolean = false;
    hideThird: boolean = false;
    penaltyTime: number = 0;
    constructor(
        private readonly canvasGameService: CanvasGameService,
        private readonly stateGameService: StateGameService,
        private readonly hintService: HintService,
    ) {}

    ngAfterViewInit(): void {
        this.hintService.hintsUsedChanged.subscribe((hintValue) => {
            this.numberHintUsed = hintValue;
            this.selectHint(this.numberHintUsed);
        });
        this.stateGameService.gameConstantsChanged.subscribe(() => {
            this.penaltyTime = this.stateGameService.gameConstants.find((constant) => constant.name === GAME_CONSTANTS_NAME.PENALTY_TIME)?.time ?? 0;
        });
    }

    getHint() {
        if (this.stateGameService.gameState !== GAME_STATE.REPLAY) {
            this.canvasGameService.hint();
            this.selectHint(this.numberHintUsed);
        }
        return;
    }

    selectHint(hint: number) {
        if (hint === 1) {
            this.hideFirst = true;
        } else if (hint === 2) {
            this.hideSecond = true;
        } else {
            this.hideThird = true;
        }
    }

    isSinglePlayer() {
        return this.stateGameService.isSinglePlayer();
    }
}
