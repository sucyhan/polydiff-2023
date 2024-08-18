import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DifferencePopupComponent } from '@app/components/difference-popup/difference-popup.component';
import { CreationService } from '@app/services/creation.service';
import { DifferenceHandlerService } from '@app/services/difference-handler.service';
import { PaintService } from '@app/services/paint.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { CREATION_HEADER, DEFAULT_HEIGHT, DEFAULT_WIDTH, DIFF_MAX, DIFF_MIN, EMPTY_IMG_SRC, ENLARGE_OPTIONS, VALID_FORMAT } from '@common/constants';
import { CanvasChanges, GameData, ImageDiffs } from '@common/interfaces';
import { Observable, fromEvent } from 'rxjs';

@Component({
    selector: 'app-creation-page',
    templateUrl: './creation-page.component.html',
    styleUrls: ['./creation-page.component.scss'],
})
export class CreationPageComponent implements AfterViewInit, OnInit {
    @ViewChild('Original') canvasOriginal: ElementRef<HTMLCanvasElement>;
    @ViewChild('OriginalZ1') canvasOriginalZ1: ElementRef<HTMLCanvasElement>;
    @ViewChild('OriginalZ2') canvasOriginalZ2: ElementRef<HTMLCanvasElement>;
    @ViewChild('Modified') canvasModified: ElementRef<HTMLCanvasElement>;
    @ViewChild('ModifiedZ1') canvasModifiedZ1: ElementRef<HTMLCanvasElement>;
    @ViewChild('ModifiedZ2') canvasModifiedZ2: ElementRef<HTMLCanvasElement>;
    @ViewChild(DifferencePopupComponent) diffPopup: DifferencePopupComponent;
    readonly creationHeader = CREATION_HEADER;
    gameName: string = '';
    readonly enlargeOptions: string[] = ENLARGE_OPTIONS;
    selectedEnlargement: string = '3';
    canvasDifference: HTMLCanvasElement;
    imgDiffs: ImageDiffs = { differences: [], difficulty: '' };
    numberDiff: number = 0;
    gameLevel: string = '';
    invalid: boolean = false;
    invalidMessage: string = '';
    showPopup: boolean = false;
    difHandler: DifferenceHandlerService = new DifferenceHandlerService();
    creationService: CreationService = new CreationService();
    paintService: PaintService = new PaintService();
    originalImageData: string = '';
    modifiedImageData: string = '';
    mergedOriginal: HTMLCanvasElement;
    mergedModified: HTMLCanvasElement;
    changes: CanvasChanges = { past: [], next: [] };

    mouseup$: Observable<Event>;

    constructor(private router: Router, private readonly storageService: StorageService, private readonly socketClient: SocketClientService) {
        this.storageService.getBaseFile(EMPTY_IMG_SRC).subscribe((baseFile) => {
            this.creationService.baseImg = new File([baseFile], 'base.bmp', { type: VALID_FORMAT });
            this.creationService.initializeImg('original');
            this.creationService.initializeImg('modified');
        });
    }

    @HostListener('window:keydown', ['$event'])
    onKeyPress($event: KeyboardEvent) {
        if (($event.ctrlKey || $event.metaKey) && $event.ctrlKey && $event.key === 'z') this.undo();
        else if (($event.ctrlKey || $event.metaKey) && $event.shiftKey && $event.key === 'Z') this.redo();
        else if ($event.key === 'Shift') this.paintService.isSquare = true;
    }

    @HostListener('window:keyup', ['$event'])
    onKeyUp($event: KeyboardEvent) {
        if ($event.key === 'Shift') this.paintService.isSquare = false;
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (this.checkTarget(event) && event.button === 0) {
            this.disableSave();
            (window.getSelection() as Selection).removeAllRanges();
            this.paintService.onMouseDown({ x: event.offsetX, y: event.offsetY }, this.getCorrectCanvas(event));
        }
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        if (this.paintService.isDrawing) {
            this.paintService.emptyCanvas(this.creationService.modifiedContextZ2);
            this.paintService.emptyCanvas(this.creationService.originalContextZ2);
            this.paintService.isDrawing = false;
        }
        this.paintService.isDrawing = false;
        if (this.checkTarget(event) && event.button !== 2) {
            this.paintService.onMouseUp({ x: event.offsetX, y: event.offsetY }, this.getCorrectCanvas(event));
            if (!this.paintService.isEqual(this.canvasModifiedZ1.nativeElement, this.canvasOriginalZ1.nativeElement)) {
                this.changes.past.push({
                    context1: this.creationService.originalContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
                    context2: this.creationService.modifiedContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
                });
                this.changes.next = [];
            }
        }
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.checkTarget(event) && this.paintService.goodCanvas === this.getCorrectCanvas(event)) {
            const ctx: CanvasRenderingContext2D = this.paintService.isRec ? this.getCorrectCanvasForRec(event) : this.getCorrectCanvas(event);
            this.paintService.onMouseMove({ x: event.offsetX, y: event.offsetY }, ctx);
        } else {
            this.paintService.currentCoordinate.x = -1;
        }
    }

    ngOnInit() {
        this.mouseup$ = fromEvent(window, 'mouseup');
        this.mouseup$.subscribe(this.disableDrawing.bind(this));
    }

    disableDrawing() {
        this.paintService.isDrawing = false;
    }

    ngAfterViewInit() {
        this.creationService.setUpContexts(this.canvasOriginal, this.canvasModified);
        this.creationService.setUpContexts(this.canvasOriginalZ1, this.canvasModifiedZ1, 'Z1');
        this.creationService.setUpContexts(this.canvasOriginalZ2, this.canvasModifiedZ2, 'Z2');
        this.canvasDifference = this.creationService.setUpCanvas(this.diffPopup.canvasDifference);
        this.disableSave();
        this.paintService = new PaintService();
        this.changes.past.push({
            context1: this.creationService.originalContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
            context2: this.creationService.modifiedContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
        });
    }

    onChangeRadius(radius: number) {
        this.paintService.radius = radius;
    }

    selectRectangle() {
        this.paintService.isRec = true;
        this.paintService.stopErasing(this.creationService.modifiedContextZ1, this.creationService.originalContextZ1);
    }

    selectDraw() {
        this.paintService.isRec = false;
        this.paintService.stopErasing(this.creationService.modifiedContextZ1, this.creationService.originalContextZ1);
    }

    selectEraser() {
        this.paintService.isRec = false;
        this.paintService.startErasing(this.creationService.modifiedContextZ1, this.creationService.originalContextZ1);
    }

    onChangeColor(color: string) {
        this.paintService.color = color;
    }

    duplicate(isLeft: boolean) {
        this.disableSave();
        if (this.paintService.isEqual(this.canvasModifiedZ1.nativeElement, this.canvasOriginalZ1.nativeElement)) {
            return;
        }
        if (isLeft) {
            this.paintService.duplicate(this.creationService.modifiedContextZ1, this.creationService.originalContextZ1);
        } else {
            this.paintService.duplicate(this.creationService.originalContextZ1, this.creationService.modifiedContextZ1);
        }
        this.changes.past.push({
            context1: this.creationService.originalContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
            context2: this.creationService.modifiedContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
        });
    }

    undo() {
        this.disableSave();
        this.paintService.undo(this.changes, this.creationService.originalContextZ1, this.creationService.modifiedContextZ1);
    }

    redo() {
        this.disableSave();
        this.paintService.redo(this.changes, this.creationService.originalContextZ1, this.creationService.modifiedContextZ1);
    }

    swap() {
        this.disableSave();
        if (this.paintService.isEqual(this.canvasModifiedZ1.nativeElement, this.canvasOriginalZ1.nativeElement)) {
            return;
        }
        this.paintService.invert(this.creationService.originalContextZ1, this.creationService.modifiedContextZ1);
        this.changes.past.push({
            context1: this.creationService.originalContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
            context2: this.creationService.modifiedContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
        });
    }

    resetFront(isOriginal: boolean) {
        this.disableSave();
        if (isOriginal) {
            if (this.paintService.isEmpty(this.canvasOriginalZ1.nativeElement)) {
                return;
            }
            this.paintService.emptyCanvas(this.creationService.originalContextZ1);
        } else {
            if (this.paintService.isEmpty(this.canvasModifiedZ1.nativeElement)) {
                return;
            }
            this.paintService.emptyCanvas(this.creationService.modifiedContextZ1);
        }
        this.changes.past.push({
            context1: this.creationService.originalContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
            context2: this.creationService.modifiedContextZ1.getImageData(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT) as ImageData,
        });
    }

    resetLayer() {
        this.resetFront(true);
        this.resetFront(false);
    }

    processImage(event: Event, imgLocation: string) {
        this.disableSave();
        this.creationService.processImage(event, imgLocation);
    }

    reset(isOriginal: boolean) {
        if (isOriginal) {
            this.paintService.emptyCanvas(this.creationService.originalContext);
            this.creationService.originalImg = this.creationService.baseImg;
            this.originalImageData = '';
            this.creationService.initializeImg('original');
        } else {
            this.paintService.emptyCanvas(this.creationService.modifiedContext);
            this.creationService.modifiedImg = this.creationService.baseImg;
            this.modifiedImageData = '';
            this.creationService.initializeImg('modified');
        }
        this.disableSave();
    }

    validate() {
        this.disableSave();
        this.mergedOriginal = this.creationService.createMergedCanvas(this.canvasOriginal, this.canvasOriginalZ1);
        this.mergedModified = this.creationService.createMergedCanvas(this.canvasModified, this.canvasModifiedZ1);
        const contexts: CanvasRenderingContext2D[] = [
            this.mergedOriginal.getContext('2d') as CanvasRenderingContext2D,
            this.mergedModified.getContext('2d') as CanvasRenderingContext2D,
            this.canvasDifference.getContext('2d') as CanvasRenderingContext2D,
        ];
        this.getDifferences(contexts);
        this.gameLevel = this.imgDiffs.difficulty;
        this.showPopup = true;
    }

    getDifferences(contexts: CanvasRenderingContext2D[]) {
        const points = this.difHandler.modImageDiff(Number(this.selectedEnlargement), contexts);
        this.imgDiffs = this.difHandler.findDifferences(contexts[2], points);
        this.numberDiff = this.imgDiffs.differences.length;
        this.validateGameSettings();
    }

    disableSave() {
        this.diffPopup.saveButton.nativeElement.disabled = true;
    }

    validateGameSettings() {
        if (DIFF_MIN > this.numberDiff) {
            this.invalid = true;
            this.invalidMessage = 'Le nombre de différences est insuffisant. Il faut entre 3 et 9 différences.';
        } else if (DIFF_MAX < this.numberDiff) {
            this.invalid = true;
            this.invalidMessage = 'Le nombre de différences est trop élevé. Il faut entre 3 et 9 différences.';
        } else {
            this.invalid = false;
            this.diffPopup.saveButton.nativeElement.disabled = false;
        }
    }

    async save(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isValidName()) {
                this.disableSave();
                const gameVariables: GameData = {
                    id: 0,
                    title: this.gameName,
                    difficulty: this.gameLevel,
                    numberOfDifferences: this.numberDiff,
                    differences: this.difHandler.getRecs(this.imgDiffs.differences),
                };
                const gameJson = JSON.stringify(gameVariables);
                const originalImageReader = new FileReader();
                const modifiedImageReader = new FileReader();
                originalImageReader.onload = async () => {
                    this.originalImageData = this.mergedOriginal.toDataURL().split(',')[1];
                    if (this.originalImageData && this.modifiedImageData) {
                        this.storageService.createFiles(this.originalImageData, this.modifiedImageData, gameJson).subscribe((response) => {
                            if (response) this.successfullyCreatedGame();
                            resolve();
                        });
                    }
                };
                modifiedImageReader.onload = async () => {
                    this.modifiedImageData = this.mergedModified.toDataURL().split(',')[1];
                    if (this.originalImageData && this.modifiedImageData) {
                        this.storageService.createFiles(this.originalImageData, this.modifiedImageData, gameJson).subscribe((response) => {
                            if (response) this.successfullyCreatedGame();
                            resolve();
                        });
                    }
                };
                originalImageReader.readAsDataURL(this.creationService.originalImg);
                modifiedImageReader.readAsDataURL(this.creationService.modifiedImg);
            } else {
                resolve();
            }
        });
    }

    successfullyCreatedGame() {
        this.socketClient.send('createdGameCard');
        window.alert('La création du jeu est un succès!');
        this.router.navigate([this.creationHeader.LINK]);
    }

    isValidName(): boolean {
        const regex = new RegExp('^d*[a-zA-Z][a-zA-Zd]*$', 'i');
        if (this.gameName.length === 0 || !regex.test(this.gameName)) {
            window.alert('Veuillez entrer un nom de jeu valide.');
            return false;
        }
        return true;
    }

    checkTarget(event: MouseEvent): boolean {
        return event.target === this.canvasOriginalZ2.nativeElement || event.target === this.canvasModifiedZ2.nativeElement;
    }

    getCorrectCanvas(event: MouseEvent): CanvasRenderingContext2D {
        if (event.target === this.canvasOriginalZ2.nativeElement) {
            return this.creationService.originalContextZ1;
        }
        return this.creationService.modifiedContextZ1;
    }

    getCorrectCanvasForRec(event: MouseEvent): CanvasRenderingContext2D {
        if (event.target === this.canvasOriginalZ2.nativeElement) {
            return this.creationService.originalContextZ2;
        }
        return this.creationService.modifiedContextZ2;
    }
}
