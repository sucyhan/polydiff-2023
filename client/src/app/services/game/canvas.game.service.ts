/* eslint-disable max-lines */
// Pas de justification, il y a trop de duplication, cest a regler
import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, ERROR_MESSAGE_HEIGHT, ERROR_MESSAGE_WIDTH, FLASHES, GAME_EVENTS, LAYERS, TIME } from '@common/constants';
import { Difference, GameData, GameEvent, PlayerData, Point, Rectangle } from '@common/interfaces';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChatGameService } from './chat.game.service';
import { DifferenceManipulationsService } from './difference-manipulations.game.service';
import { HintService } from './hint.game.service';
import { StateGameService } from './state.game.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasGameService implements OnDestroy {
    originalMultiLayerDiv: ElementRef<HTMLDivElement>;
    modifiedMultiLayerDiv: ElementRef<HTMLDivElement>;
    originalLayersContexts: Map<string, CanvasRenderingContext2D> = new Map();
    modifiedLayersContexts: Map<string, CanvasRenderingContext2D> = new Map();
    layers: string[] = [LAYERS.IMAGE, LAYERS.FLASH_DIFFERENCE, LAYERS.DIFFERENCE_FOUND, LAYERS.HINT, LAYERS.ERROR, LAYERS.CURSOR];

    originalImage: HTMLImageElement = new Image();
    modifiedImage: HTMLImageElement = new Image();

    originalImageSrc: string = '';
    modifiedImageSrc: string = '';

    gameData: GameData = { id: 0, title: '', difficulty: '', numberOfDifferences: 0, differences: [] };
    gameDataSubscription: Subscription;

    players: PlayerData[] = [];
    oldDifferenceFound: Difference[] = [];
    playersSubscription: Subscription;
    audio: HTMLAudioElement[] = [];

    originalData: ImageData = new ImageData(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    modifiedData: ImageData = new ImageData(DEFAULT_WIDTH, DEFAULT_HEIGHT);

    intervalId: ReturnType<typeof setTimeout> = setTimeout(() => ({}));
    isFlashing: boolean = false;

    // eslint-disable-next-line max-params
    constructor(
        private readonly stateGameService: StateGameService,
        private readonly hintService: HintService,
        private readonly chatService: ChatGameService,
        private readonly diffManip: DifferenceManipulationsService,
    ) {
        this.gameData = this.stateGameService.gameData;
        this.gameDataSubscription = this.stateGameService.gameDataChanged.subscribe((gameData: GameData) => {
            this.gameData = gameData;
            this.setUp();
        });

        this.players = this.stateGameService.players;
        this.playersSubscription = this.stateGameService.playersChanged.subscribe(() => {
            this.players = this.stateGameService.players;
            this.checkForNewDifferenceFound();
            this.checkForNewInvalidMove();
        });
    }

    setUp() {
        if (this.gameData.id && this.originalMultiLayerDiv && this.modifiedMultiLayerDiv) {
            this.setUpContexts();
            this.setUpSources();
            this.setUpImages().then(() => {
                const event: GameEvent = { type: GAME_EVENTS.START, time: this.stateGameService.time, eventData: [] };
                this.stateGameService.replayEvents.push(event);
            });
        }
    }

    setUpContexts() {
        for (const layer of this.layers) {
            const singleCanvasComponent: Element = this.originalMultiLayerDiv.nativeElement.children.namedItem(layer) as Element;
            const canvas: HTMLCanvasElement = singleCanvasComponent.children.namedItem('canvas') as HTMLCanvasElement;
            const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
            canvas.width = DEFAULT_WIDTH;
            canvas.height = DEFAULT_HEIGHT;
            this.originalLayersContexts.set(layer, context);
        }
        for (const layer of this.layers) {
            const singleCanvasComponent: Element = this.modifiedMultiLayerDiv.nativeElement.children.namedItem(layer) as Element;
            const canvas: HTMLCanvasElement = singleCanvasComponent.children.namedItem('canvas') as HTMLCanvasElement;
            const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
            canvas.width = DEFAULT_WIDTH;
            canvas.height = DEFAULT_HEIGHT;
            this.modifiedLayersContexts.set(layer, context);
        }
    }

    setUpSources() {
        this.originalImageSrc = environment.serverUrl + '/storage/originalImage/' + this.gameData.id + '.bmp';
        this.modifiedImageSrc = environment.serverUrl + '/storage/modifiedImage/' + this.gameData.id + '.bmp';
    }

    async setUpImages(): Promise<void> {
        return new Promise((resolve) => {
            this.originalImage = new Image();
            this.originalImage.src = this.originalImageSrc;
            this.originalImage.onload = async () => {
                this.originalImage.setAttribute('crossOrigin', 'anonymous');
                (this.originalLayersContexts.get(LAYERS.IMAGE) as CanvasRenderingContext2D).drawImage(this.originalImage, 0, 0);
                this.originalData = (this.originalLayersContexts.get(LAYERS.IMAGE) as CanvasRenderingContext2D).getImageData(
                    0,
                    0,
                    DEFAULT_WIDTH,
                    DEFAULT_HEIGHT,
                );
                resolve();
            };
            this.modifiedImage = new Image();
            this.modifiedImage.src = this.modifiedImageSrc;
            this.modifiedImage.onload = async () => {
                this.modifiedImage.setAttribute('crossOrigin', 'anonymous');
                (this.modifiedLayersContexts.get(LAYERS.IMAGE) as CanvasRenderingContext2D).drawImage(this.modifiedImage, 0, 0);
                this.modifiedData = (this.modifiedLayersContexts.get(LAYERS.IMAGE) as CanvasRenderingContext2D).getImageData(
                    0,
                    0,
                    DEFAULT_WIDTH,
                    DEFAULT_HEIGHT,
                );
                resolve();
            };
        });
    }

    checkForNewDifferenceFound() {
        for (const player of this.players) {
            for (const difference of player.differencesFound) {
                if (!this.diffManip.differencesInclude(difference, this.oldDifferenceFound)) {
                    this.flashDifference(difference);
                    this.addFoundDifference(difference);
                    this.playNoise();
                    this.oldDifferenceFound.push(difference);
                    this.stateGameService.replayEvents.push({
                        type: GAME_EVENTS.DIFFERENCE_FOUND,
                        time: this.stateGameService.time,
                        eventData: { difference, username: player.username },
                    });
                }
            }
        }
    }
    checkForNewInvalidMove() {
        for (const invalidMove of this.stateGameService.currentPlayer.invalidMoves) {
            this.stateGameService.replayEvents.push({ type: GAME_EVENTS.ERROR, time: this.stateGameService.time, eventData: invalidMove });
            this.drawErrorMessage(invalidMove);
        }
        if (this.stateGameService.currentPlayer.invalidMoves.length === 0) {
            this.clearErrorMessages();
        } else {
            this.playError();
        }
    }

    flashDifference(difference: Difference) {
        if (!this.originalLayersContexts.get(LAYERS.FLASH_DIFFERENCE) || !this.modifiedLayersContexts.get(LAYERS.FLASH_DIFFERENCE)) return;
        const contexts: CanvasRenderingContext2D[] = [
            this.originalLayersContexts.get(LAYERS.FLASH_DIFFERENCE) as CanvasRenderingContext2D,
            this.modifiedLayersContexts.get(LAYERS.FLASH_DIFFERENCE) as CanvasRenderingContext2D,
        ];
        for (const context of contexts) {
            for (let i = 0; i < FLASHES * 2 - 1; i++) {
                if (i % 2 === 0) {
                    setTimeout(() => {
                        this.drawDifference(context, this.modifiedImage, difference);
                    }, TIME.ONE_TENTH_SECOND * (i + 1));
                } else {
                    setTimeout(() => {
                        this.drawDifference(context, this.originalImage, difference);
                    }, TIME.ONE_TENTH_SECOND * (i + 1));
                }
            }
            setTimeout(() => {
                this.clearDifference(context, difference);
            }, TIME.ONE_TENTH_SECOND * (FLASHES * 2));
        }
    }

    addFoundDifference(difference: Difference) {
        if (!this.originalLayersContexts.get(LAYERS.DIFFERENCE_FOUND) || !this.modifiedLayersContexts.get(LAYERS.DIFFERENCE_FOUND)) return;
        const contexts = [
            this.originalLayersContexts.get(LAYERS.DIFFERENCE_FOUND) as CanvasRenderingContext2D,
            this.modifiedLayersContexts.get(LAYERS.DIFFERENCE_FOUND) as CanvasRenderingContext2D,
        ];
        for (const context of contexts) {
            setTimeout(() => {
                this.drawDifference(context, this.modifiedImage, difference);
            }, TIME.ONE_TENTH_SECOND * (FLASHES * 2));
        }
    }

    clearDifference(context: CanvasRenderingContext2D, difference: Difference) {
        for (const rectangle of difference.rectangles) {
            context.clearRect(
                rectangle.point1.x,
                rectangle.point1.y,
                rectangle.point2.x - rectangle.point1.x + 1,
                rectangle.point2.y - rectangle.point1.y + 1,
            );
        }
    }

    drawDifference(context: CanvasRenderingContext2D, src: HTMLImageElement, difference: Difference) {
        const overlap = 2;
        for (const rectangle of difference.rectangles) {
            context.drawImage(
                src,
                rectangle.point1.x - overlap,
                rectangle.point1.y - overlap,
                rectangle.point2.x - rectangle.point1.x + 2 * overlap,
                rectangle.point2.y - rectangle.point1.y + 2 * overlap,
                rectangle.point1.x - overlap,
                rectangle.point1.y - overlap,
                rectangle.point2.x - rectangle.point1.x + 2 * overlap,
                rectangle.point2.y - rectangle.point1.y + 2 * overlap,
            );
        }
    }

    clearErrorMessages() {
        if (!this.originalLayersContexts.get(LAYERS.ERROR) || !this.modifiedLayersContexts.get(LAYERS.ERROR)) return;
        const contexts = [
            this.originalLayersContexts.get(LAYERS.ERROR) as CanvasRenderingContext2D,
            this.modifiedLayersContexts.get(LAYERS.ERROR) as CanvasRenderingContext2D,
        ];
        for (const context of contexts) {
            context.clearRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        }
    }

    drawErrorMessage(invalidMove: Point) {
        if (!this.originalLayersContexts.get(LAYERS.ERROR) || !this.modifiedLayersContexts.get(LAYERS.ERROR)) return;
        const contexts = [
            this.originalLayersContexts.get(LAYERS.ERROR) as CanvasRenderingContext2D,
            this.modifiedLayersContexts.get(LAYERS.ERROR) as CanvasRenderingContext2D,
        ];
        for (const context of contexts) {
            const coordinate = { x: invalidMove.x - ERROR_MESSAGE_WIDTH / 2, y: invalidMove.y + ERROR_MESSAGE_HEIGHT / 2 };
            if (coordinate.x > DEFAULT_WIDTH - ERROR_MESSAGE_WIDTH) {
                coordinate.x = DEFAULT_WIDTH - ERROR_MESSAGE_WIDTH;
            }
            if (coordinate.y > DEFAULT_HEIGHT) {
                coordinate.y = DEFAULT_HEIGHT;
            }
            if (coordinate.x < 0) {
                coordinate.x = 0;
            }
            if (coordinate.y < ERROR_MESSAGE_HEIGHT) {
                coordinate.y = ERROR_MESSAGE_HEIGHT;
            }
            context.font = '30px Arial';
            context.fillStyle = 'red';
            context.fillText('ERROR', coordinate.x, coordinate.y);
        }
    }

    playNoise() {
        const noise = new Audio('assets/success-sound.mp3');
        this.audio.push(noise);
        noise.play();
        noise.onended = () => {
            this.audio = this.audio.filter((audio) => audio !== noise);
        };
    }

    playError() {
        const noise = new Audio('assets/frog-sound.mp3');
        this.audio.push(noise);
        noise.play();
        noise.onended = () => {
            this.audio = this.audio.filter((audio) => audio !== noise);
        };
    }

    cheatMode() {
        this.stateGameService.replayEvents.push({ type: GAME_EVENTS.CHEAT_MODE, time: this.stateGameService.time, eventData: {} });
        if (!this.isFlashing) {
            for (const difference of this.getNotFoundDifferences(this.stateGameService.gameData.differences, this.oldDifferenceFound)) {
                this.flashDifference(difference);
            }
            this.intervalId = setInterval(() => {
                for (const difference of this.getNotFoundDifferences(this.stateGameService.gameData.differences, this.oldDifferenceFound)) {
                    this.flashDifference(difference);
                }
            }, TIME.ONE_SECOND);
            this.isFlashing = true;
        } else {
            clearInterval(this.intervalId);
            this.isFlashing = false;
        }
    }

    getNotFoundDifferences(differences: Difference[], differencesFound: Difference[]): Difference[] {
        const notFoundDifferences: Difference[] = [];
        for (const firstDiff of differences) {
            let foundMatch = false;
            for (const secondDiff of differencesFound) if (this.isSameDifference(firstDiff, secondDiff)) foundMatch = true;
            if (!foundMatch) notFoundDifferences.push(firstDiff);
        }
        return notFoundDifferences;
    }

    isSameDifference(difference1: Difference, difference2: Difference): boolean {
        if (difference1.rectangles.length !== difference2.rectangles.length) return false;
        for (const [index, rect1] of difference1.rectangles.entries()) {
            const rect2 = difference2.rectangles[index];
            if (!this.isSameRectangle(rect1, rect2)) return false;
        }
        return true;
    }

    isSameRectangle(rectangle1: Rectangle, rectangle2: Rectangle): boolean {
        return (
            rectangle1.point1.x === rectangle2.point1.x &&
            rectangle1.point1.y === rectangle2.point1.y &&
            rectangle1.point2.x === rectangle2.point2.x &&
            rectangle1.point2.y === rectangle2.point2.y
        );
    }

    hint() {
        if (this.hintService.isHintAvailable()) {
            const contexts = [
                this.originalLayersContexts.get(LAYERS.HINT) as CanvasRenderingContext2D,
                this.modifiedLayersContexts.get(LAYERS.HINT) as CanvasRenderingContext2D,
            ];

            const differencesNotFound: Difference[] = this.gameData.differences.filter(
                (difference) => !this.diffManip.differencesInclude(difference, this.players[0].differencesFound),
            );

            const newChat = this.chatService.setHintUsed(this.stateGameService.time);
            this.chatService.addChatMessage(newChat);

            this.hintService.handleHint(contexts, differencesNotFound);
        }
    }

    resetHints() {
        this.hintService.reset();
    }

    ngOnDestroy(): void {
        this.gameDataSubscription.unsubscribe();
        this.playersSubscription.unsubscribe();
        this.hintService.reset();
    }

    replayReset() {
        for (const layer of this.layers) {
            this.originalLayersContexts.get(layer)?.clearRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
            this.modifiedLayersContexts.get(layer)?.clearRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        }
        this.originalLayersContexts.get(LAYERS.IMAGE)?.putImageData(this.originalData as unknown as ImageData, 0, 0);
        this.modifiedLayersContexts.get(LAYERS.IMAGE)?.putImageData(this.modifiedData as unknown as ImageData, 0, 0);
        this.oldDifferenceFound = [];
        this.players.forEach((player) => {
            player.differencesFound = [];
            player.invalidMoves = [];
        });

        if (this.isFlashing) {
            this.cheatMode();
        }
    }
}
