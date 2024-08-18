import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CanvasGameService } from '@app/services/game/canvas.game.service';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { MouseGameService } from '@app/services/game/mouse-handler.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, GAME_PLAYER_MODE, GAME_STATE, LAYERS } from '@common/constants';
import { GameData } from '@common/interfaces';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('original') original: ElementRef<HTMLDivElement>;
    @ViewChild('modified') modified: ElementRef<HTMLDivElement>;
    layers: string[] = [LAYERS.IMAGE, LAYERS.DIFFERENCE_FOUND, LAYERS.FLASH_DIFFERENCE, LAYERS.HINT, LAYERS.ERROR, LAYERS.CURSOR];
    gameData: GameData = { id: 0, title: '', difficulty: '', numberOfDifferences: 0, differences: [] };
    gameDataSubscription: Subscription;
    // Service injection
    // eslint-disable-next-line max-params
    constructor(
        private readonly stateGameService: StateGameService,
        private readonly mouseGameService: MouseGameService,
        private readonly canvasGameService: CanvasGameService,
        private readonly controllerGameService: ControllerGameService,
    ) {}

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (this.isMouseInCanvas(event) && this.stateGameService.gameState !== GAME_STATE.REPLAY)
            this.mouseGameService.onMouseDown(this.eventToCanvas(event));
    }

    @HostListener('window:popstate', ['$event'])
    onPopState(event: Event) {
        if (event instanceof PopStateEvent) this.controllerGameService.abandonGame();
    }

    buttonDetect(event: KeyboardEvent) {
        if (this.stateGameService.gameState === GAME_STATE.IN_GAME) {
            if (event.key === 't' || event.key === 'T') {
                this.canvasGameService.cheatMode();
            } else if ((event.key === 'i' || event.key === 'I') && this.stateGameService.playerMode === GAME_PLAYER_MODE.SINGLE_PLAYER) {
                this.canvasGameService.hint();
            }
        }
    }
    eventToCanvas(event: MouseEvent): { x: number; y: number } {
        return {
            x: Math.round((event.offsetX * DEFAULT_WIDTH) / this.original.nativeElement.offsetWidth),
            y: Math.round((event.offsetY * DEFAULT_HEIGHT) / this.original.nativeElement.offsetHeight),
        };
    }
    isMouseInCanvas(event: MouseEvent): boolean {
        return (
            event.target === this.original.nativeElement.children.namedItem(LAYERS.CURSOR)?.children.namedItem('canvas') ||
            event.target === this.modified.nativeElement.children.namedItem(LAYERS.CURSOR)?.children.namedItem('canvas')
        );
    }

    ngOnInit(): void {
        this.gameData = this.stateGameService.gameData;
        this.gameDataSubscription = this.stateGameService.gameDataChanged.subscribe(() => {
            this.gameData = this.stateGameService.gameData;
        });
        this.stateGameService.socketClient.disconnect();
        this.stateGameService.gameState = GAME_STATE.IN_GAME;
        this.stateGameService.gameStateChanged.next(this.stateGameService.gameState);
        this.controllerGameService.handleSocket();
        this.canvasGameService.isFlashing = false;
        clearInterval(this.canvasGameService.intervalId);
    }

    ngAfterViewInit(): void {
        this.canvasGameService.originalMultiLayerDiv = this.original;
        this.canvasGameService.modifiedMultiLayerDiv = this.modified;
        this.canvasGameService.gameData = this.gameData;
        this.canvasGameService.setUp();
        this.controllerGameService.setUp(this.stateGameService.router.url);
    }

    ngOnDestroy(): void {
        this.canvasGameService.resetHints();
        this.canvasGameService.replayReset();
        this.gameDataSubscription.unsubscribe();
    }
}
