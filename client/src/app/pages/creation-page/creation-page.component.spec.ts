import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AppModule } from '@app/app.module';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { DifferencePopupComponent } from '@app/components/difference-popup/difference-popup.component';
import { ToolBoxComponent } from '@app/components/tool-box/tool-box.component';
import { CreationService } from '@app/services/creation.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { COLOR, CREATION_HEADER, DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@common/constants';
import { ImageDiffs } from '@common/interfaces';
import { of } from 'rxjs';
import { CreationPageComponent } from './creation-page.component';

export const testData = {
    id: 0,
    name: 'TESTGAME',
    difficulty: 'Difficile',
    numberOfDifferences: 7,
    differences: [
        {
            rectangles: [
                {
                    point1: {
                        x: 309,
                        y: 197,
                    },
                    point2: {
                        x: 350,
                        y: 197,
                    },
                },
            ],
        },
        {
            rectangles: [
                {
                    point1: {
                        x: 159,
                        y: 233,
                    },
                    point2: {
                        x: 192,
                        y: 233,
                    },
                },
            ],
        },
    ],

    imgDiff: [
        [
            {
                x: 415,
                y: 73,
            },
            {
                x: 415,
                y: 74,
            },
        ],
        [
            {
                x: 415,
                y: 72,
            },
            {
                x: 414,
                y: 73,
            },
        ],
    ],
};
class MockSocketClientService {
    send(): void {
        return;
    }
}

describe('CreationPageComponent', () => {
    let component: CreationPageComponent;
    let fixture: ComponentFixture<CreationPageComponent>;
    let storageService: StorageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CreationPageComponent, DifferencePopupComponent, ToolBoxComponent],
            imports: [RouterTestingModule, HttpClientTestingModule, AppModule],
            providers: [
                { provide: StorageService, useValue: { getBaseFile: () => of(new Blob()), createFiles: () => of('done') } },
                { provide: CreationService },
                { provide: SocketClientService, useClass: MockSocketClientService },
            ],
        }).compileComponents();

        storageService = TestBed.inject(StorageService);
        fixture = TestBed.createComponent(CreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        spyOn(component['router'], 'navigate').and.returnValue(Promise.resolve(true));
    });

    it('should create', () => {
        expect(storageService).toBeDefined();
        expect(component).toBeTruthy();
    });

    it('constructor should set baseImg', () => {
        expect(component.creationService.baseImg).toBeDefined();
    });

    it('onKeyPress should call undo if key is ctrl+z', () => {
        const undoSpy = spyOn(component, 'undo').and.returnValue();
        const redoSpy = spyOn(component, 'redo').and.returnValue();
        const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
        component.onKeyPress(event);
        expect(undoSpy).toHaveBeenCalled();
        expect(redoSpy).not.toHaveBeenCalled();
        expect(component.paintService.isSquare).toBeFalse();
    });

    it('onKeyPress should call redo if key is ctrl+shift+Z', () => {
        const undoSpy = spyOn(component, 'undo').and.returnValue();
        const redoSpy = spyOn(component, 'redo').and.returnValue();
        const event = new KeyboardEvent('keydown', { key: 'Z', ctrlKey: true, shiftKey: true });
        component.onKeyPress(event);
        expect(undoSpy).not.toHaveBeenCalled();
        expect(redoSpy).toHaveBeenCalled();
        expect(component.paintService.isSquare).toBeFalse();
    });

    it('onKeyPress should set paintService.isSquare to true if key is shift', () => {
        const undoSpy = spyOn(component, 'undo').and.returnValue();
        const redoSpy = spyOn(component, 'redo').and.returnValue();
        const event = new KeyboardEvent('keydown', { key: 'Shift' });
        component.onKeyPress(event);
        expect(component.paintService.isSquare).toBeTrue();
        expect(undoSpy).not.toHaveBeenCalled();
        expect(redoSpy).not.toHaveBeenCalled();
    });

    it('onKeyUp should set paintService.isSquare to false if key is shift', () => {
        const event = new KeyboardEvent('keyup', { key: 'Shift' });
        component.onKeyUp(event);
        expect(component.paintService.isSquare).toBeFalse();
    });

    it('onKeyUp should not set paintService.isSquare to false if key is not shift', () => {
        const event = new KeyboardEvent('keyup', { key: 'z' });
        component.paintService.isSquare = true;
        component.onKeyUp(event);
        expect(component.paintService.isSquare).toBeTrue();
    });

    it('onMouseDown should call paintService.onMouseDown if checkTarget returns true', () => {
        const checkTargetSpy = spyOn(component, 'checkTarget').and.returnValue(true);
        const onMouseDownSpy = spyOn(component.paintService, 'onMouseDown').and.returnValue();
        const event = new MouseEvent('mousedown', { clientX: 0, clientY: 0 });
        component.onMouseDown(event);
        expect(checkTargetSpy).toHaveBeenCalled();
        expect(onMouseDownSpy).toHaveBeenCalledWith({ x: event.offsetX, y: event.offsetY }, component.getCorrectCanvas(event));
    });

    it('onMouseDown should not call paintService.onMouseDown if checkTarget returns false', () => {
        const checkTargetSpy = spyOn(component, 'checkTarget').and.returnValue(false);
        const onMouseDownSpy = spyOn(component.paintService, 'onMouseDown').and.returnValue();
        const event = new MouseEvent('mousedown', { clientX: 0, clientY: 0 });
        component.onMouseDown(event);
        expect(checkTargetSpy).toHaveBeenCalled();
        expect(onMouseDownSpy).not.toHaveBeenCalled();
    });

    it('onMouseUp should call paintService.emptyCanvas if isDrawing is true', () => {
        const emptyCanvasSpy = spyOn(component.paintService, 'emptyCanvas').and.returnValue();
        spyOn(component, 'checkTarget').and.returnValue(false);
        component.paintService.isDrawing = true;
        const event = new MouseEvent('mouseup', { clientX: 0, clientY: 0 });
        const ctxModified = component.canvasModifiedZ2.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctxOriginal = component.canvasOriginalZ2.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.onMouseUp(event);
        expect(emptyCanvasSpy).toHaveBeenCalledWith(ctxModified);
        expect(emptyCanvasSpy).toHaveBeenCalledWith(ctxOriginal);
    });

    it('onMouseUp should not call paintService.emptyCanvas if isDrawing is false', () => {
        const emptyCanvasSpy = spyOn(component.paintService, 'emptyCanvas').and.returnValue();
        spyOn(component, 'checkTarget').and.returnValue(false);
        component.paintService.isDrawing = false;
        const event = new MouseEvent('mouseup', { clientX: 0, clientY: 0 });
        const ctxModified = component.canvasModifiedZ2.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctxOriginal = component.canvasOriginalZ2.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.onMouseUp(event);
        expect(emptyCanvasSpy).not.toHaveBeenCalledWith(ctxModified);
        expect(emptyCanvasSpy).not.toHaveBeenCalledWith(ctxOriginal);
    });

    it('onMouseUp should set isDrawing to false', () => {
        spyOn(component, 'checkTarget').and.returnValue(false);
        component.paintService.isDrawing = true;
        const event = new MouseEvent('mouseup', { clientX: 0, clientY: 0 });
        component.onMouseUp(event);
        expect(component.paintService.isDrawing).toBeFalse();
    });

    it('onMouseUp should call paintService.onMouseUp if checkTarget returns true', () => {
        const checkTargetSpy = spyOn(component, 'checkTarget').and.returnValue(true);
        const onMouseUpSpy = spyOn(component.paintService, 'onMouseUp').and.returnValue();
        const event = new MouseEvent('mouseup', { clientX: 0, clientY: 0 });
        component.onMouseUp(event);
        expect(checkTargetSpy).toHaveBeenCalled();
        expect(onMouseUpSpy).toHaveBeenCalledWith({ x: event.offsetX, y: event.offsetY }, component.getCorrectCanvas(event));
    });

    it('onMouseUp should call push on pastChanges if checkTarget returns true and isEqual return false', () => {
        const checkTargetSpy = spyOn(component, 'checkTarget').and.returnValue(true);
        const isEqualSpy = spyOn(component.paintService, 'isEqual').and.returnValue(false);
        const pushSpy = spyOn(component.changes.past, 'push').and.returnValue(0);
        const ctxModified = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctxOriginal = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const imgData = new ImageData(1, 1);
        spyOn(ctxModified, 'getImageData').and.returnValue(imgData);
        spyOn(ctxOriginal, 'getImageData').and.returnValue(imgData);
        const event = new MouseEvent('mouseup', { clientX: 0, clientY: 0 });
        component.onMouseUp(event);
        expect(checkTargetSpy).toHaveBeenCalled();
        expect(isEqualSpy).toHaveBeenCalled();
        expect(pushSpy).toHaveBeenCalledWith({ context1: imgData, context2: imgData });
        expect(component.changes.next).toEqual([]);
    });

    it('onMouseMove should call onMouseMove with getCorrectCanvas if checkTarget returns true, goodCanvas = correctCanvas and isRec is false', () => {
        const checkTargetSpy = spyOn(component, 'checkTarget').and.returnValue(true);
        const onMouseMoveSpy = spyOn(component.paintService, 'onMouseMove').and.returnValue();
        const event = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });
        component.paintService.goodCanvas = component.getCorrectCanvas(event);
        component.paintService.isRec = false;
        component.onMouseMove(event);
        expect(checkTargetSpy).toHaveBeenCalled();
        expect(onMouseMoveSpy).toHaveBeenCalledWith({ x: event.offsetX, y: event.offsetY }, component.getCorrectCanvas(event));
    });

    it('onMouseMove should call onMouseMove with getCorrectCanvasRec if checkTarget is true, goodCanvas = correctCanvas and isRec is true', () => {
        const checkTargetSpy = spyOn(component, 'checkTarget').and.returnValue(true);
        const onMouseMoveSpy = spyOn(component.paintService, 'onMouseMove').and.returnValue();
        const event = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });
        component.paintService.goodCanvas = component.getCorrectCanvas(event);
        component.paintService.isRec = true;
        component.onMouseMove(event);
        expect(checkTargetSpy).toHaveBeenCalled();
        expect(onMouseMoveSpy).toHaveBeenCalledWith({ x: event.offsetX, y: event.offsetY }, component.getCorrectCanvasForRec(event));
    });

    it('onMouseMove should not call onMouseMove if checkTarget returns false', () => {
        const checkTargetSpy = spyOn(component, 'checkTarget').and.returnValue(false);
        const onMouseMoveSpy = spyOn(component.paintService, 'onMouseMove').and.returnValue();
        const event = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });
        component.onMouseMove(event);
        expect(checkTargetSpy).toHaveBeenCalled();
        expect(onMouseMoveSpy).not.toHaveBeenCalled();
    });

    it('disableDrawing should set isDrawing to false', () => {
        component.disableDrawing();
        expect(component.paintService.isDrawing).toBeFalse();
    });

    it('ngAfterViewInit should set up canvasDifference', () => {
        component.ngAfterViewInit();
        expect(component.canvasDifference.width).toEqual(DEFAULT_WIDTH);
        expect(component.canvasDifference.height).toEqual(DEFAULT_HEIGHT);
    });

    it('onChangeRadius should set paintService radius', () => {
        const radius = 100;
        component.onChangeRadius(radius);
        expect(component.paintService.radius).toEqual(radius);
    });

    it('selectRectangle should set isRec to true and call stopErasing', () => {
        const stopErasingSpy = spyOn(component.paintService, 'stopErasing').and.returnValue();
        const ctx1 = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctx2 = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.selectRectangle();
        expect(component.paintService.isRec).toBeTrue();
        expect(stopErasingSpy).toHaveBeenCalledWith(ctx1, ctx2);
    });

    it('selectDraw should set isRec to false and call stopErasing', () => {
        const stopErasingSpy = spyOn(component.paintService, 'stopErasing').and.returnValue();
        const ctx1 = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctx2 = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.selectDraw();
        expect(component.paintService.isRec).toBeFalse();
        expect(stopErasingSpy).toHaveBeenCalledWith(ctx1, ctx2);
    });

    it('selectEraser should set isRec to false and call startErasing', () => {
        const startErasingSpy = spyOn(component.paintService, 'startErasing').and.returnValue();
        const ctx1 = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctx2 = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.selectEraser();
        expect(component.paintService.isRec).toBeFalse();
        expect(startErasingSpy).toHaveBeenCalledWith(ctx1, ctx2);
    });

    it('onChangeColor should set paintService color', () => {
        const color = COLOR.red;
        component.onChangeColor(color);
        expect(component.paintService.color).toEqual(color);
    });

    it('duplicate should call duplicate on paintService with originalCanvas first if canvas are not equal ans isLeft is false', () => {
        spyOn(component.paintService, 'isEqual').and.returnValue(false);
        const duplicateSpy = spyOn(component.paintService, 'duplicate');
        const ctxOriginal = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctxModified = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.duplicate(false);
        expect(component.paintService.isEqual).toHaveBeenCalled();
        expect(duplicateSpy).toHaveBeenCalledWith(ctxOriginal, ctxModified);
    });

    it('duplicate should call duplicate on paintService with modifiedCanvas first if canvas are not equal ans isLeft is true', () => {
        spyOn(component.paintService, 'isEqual').and.returnValue(false);
        const duplicateSpy = spyOn(component.paintService, 'duplicate').and.returnValue();
        const ctxOriginal = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctxModified = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.duplicate(true);
        expect(component.paintService.isEqual).toHaveBeenCalled();
        expect(duplicateSpy).toHaveBeenCalledWith(ctxModified, ctxOriginal);
    });

    it('duplicate should call push on pastChanges if canvas are not equal', () => {
        spyOn(component.paintService, 'isEqual').and.returnValue(false);
        const pushSpy = spyOn(component.changes.past, 'push').and.returnValue(0);
        const ctxOriginal = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctxModified = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const imgData = new ImageData(1, 1);
        spyOn(ctxOriginal, 'getImageData').and.returnValue(imgData);
        spyOn(ctxModified, 'getImageData').and.returnValue(imgData);
        component.duplicate(false);
        expect(component.paintService.isEqual).toHaveBeenCalled();
        expect(pushSpy).toHaveBeenCalledWith({ context1: imgData, context2: imgData });
    });

    it('duplicate should not call duplicate on paintService and push on pastChanges if canvas are equal', () => {
        spyOn(component.paintService, 'isEqual').and.returnValue(true);
        const duplicateSpy = spyOn(component.paintService, 'duplicate').and.returnValue();
        const pushSpy = spyOn(component.changes.past, 'push').and.returnValue(0);
        component.duplicate(false);
        expect(component.paintService.isEqual).toHaveBeenCalled();
        expect(duplicateSpy).not.toHaveBeenCalled();
        expect(pushSpy).not.toHaveBeenCalled();
    });

    it('undo should call undo on paintService', () => {
        const undoSpy = spyOn(component.paintService, 'undo').and.returnValue();
        const ctx1 = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctx2 = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.undo();
        expect(undoSpy).toHaveBeenCalledWith(component.changes, ctx1, ctx2);
    });

    it('redo should call redo on paintService', () => {
        const redoSpy = spyOn(component.paintService, 'redo').and.returnValue();
        const ctx1 = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctx2 = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        component.redo();
        expect(redoSpy).toHaveBeenCalledWith(component.changes, ctx1, ctx2);
    });

    it('swap should call invert on paintService and push pastChanges if canvas are not equal', () => {
        spyOn(component.paintService, 'isEqual').and.returnValue(false);
        const invertSpy = spyOn(component.paintService, 'invert').and.returnValue();
        const pushSpy = spyOn(component.changes.past, 'push').and.returnValue(0);
        const ctx1 = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctx2 = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const imgData = new ImageData(1, 1);
        spyOn(ctx1, 'getImageData').and.returnValue(imgData);
        spyOn(ctx2, 'getImageData').and.returnValue(imgData);
        component.swap();
        expect(invertSpy).toHaveBeenCalledWith(ctx1, ctx2);
        expect(pushSpy).toHaveBeenCalledWith({ context1: imgData, context2: imgData });
    });

    it('swap should not call invert on paintService and push pastChanges if canvas are equal', () => {
        spyOn(component.paintService, 'isEqual').and.returnValue(true);
        const invertSpy = spyOn(component.paintService, 'invert').and.returnValue();
        const pushSpy = spyOn(component.changes.past, 'push').and.returnValue(0);
        component.swap();
        expect(invertSpy).not.toHaveBeenCalled();
        expect(pushSpy).not.toHaveBeenCalled();
    });

    it('resetLayer should call emptyCanvas on paintService and push pastChanges if canvas are not empty', () => {
        spyOn(component.paintService, 'isEmpty').and.returnValue(false);
        const emptyCanvasSpy = spyOn(component.paintService, 'emptyCanvas').and.returnValue();
        const pushSpy = spyOn(component.changes.past, 'push').and.returnValue(0);
        const ctx1 = component.canvasOriginalZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const ctx2 = component.canvasModifiedZ1.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        const imgData = new ImageData(1, 1);
        spyOn(ctx1, 'getImageData').and.returnValue(imgData);
        spyOn(ctx2, 'getImageData').and.returnValue(imgData);
        component.resetLayer();
        expect(emptyCanvasSpy).toHaveBeenCalledWith(ctx1);
        expect(emptyCanvasSpy).toHaveBeenCalledWith(ctx2);
        expect(pushSpy).toHaveBeenCalledWith({ context1: imgData, context2: imgData });
    });

    it('resetLayer should not call emptyCanvas on paintService and push pastChanges if canvas are empty', () => {
        spyOn(component.paintService, 'isEmpty').and.returnValue(true);
        const emptyCanvasSpy = spyOn(component.paintService, 'emptyCanvas').and.returnValue();
        const pushSpy = spyOn(component.changes.past, 'push').and.returnValue(0);
        component.resetLayer();
        expect(emptyCanvasSpy).not.toHaveBeenCalled();
        expect(pushSpy).not.toHaveBeenCalled();
    });

    it('should have a creation header set as CREATION_HEADER', () => {
        expect(component.creationHeader).toBeDefined();
        expect(component.creationHeader).toEqual(CREATION_HEADER);
    });

    it('disableSave should disable saveButton', () => {
        component.disableSave();
        expect(component.diffPopup.saveButton.nativeElement.disabled).toBeTrue();
    });

    it('should call reset on original image when reset button is clicked', () => {
        const resetSpy = spyOn(component, 'reset');
        const button = fixture.debugElement.query(By.css('#resetO')).nativeElement;
        button.click();
        expect(resetSpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalledWith(true);
    });

    it('should call reset on modified image when reset button is clicked', () => {
        const resetSpy = spyOn(component, 'reset');
        const button = fixture.debugElement.query(By.css('#resetM')).nativeElement;
        button.click();
        expect(resetSpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalledWith(false);
    });

    it('reset should call disableSave', () => {
        const disableSaveSpy = spyOn(component, 'disableSave');
        component.reset(true);
        expect(disableSaveSpy).toHaveBeenCalled();
        component.reset(false);
        expect(disableSaveSpy).toHaveBeenCalled();
    });

    it('validateGameSetting should activate save button if number of differences is valid', () => {
        component.disableSave();
        component.numberDiff = 6;
        component.validateGameSettings();
        expect(component.diffPopup.saveButton.nativeElement.disabled).toBeFalse();
        expect(component.invalid).toBeFalse();
    });

    it('validateGameSetting should set invalid attribut to true and set invalidMessage if numberDiff too low', () => {
        component.disableSave();
        component.numberDiff = 0;
        component.validateGameSettings();
        expect(component.diffPopup.saveButton.nativeElement.disabled).toBeTrue();
        expect(component.invalid).toBeTrue();
        expect(component.invalidMessage).toEqual('Le nombre de différences est insuffisant. Il faut entre 3 et 9 différences.');
    });

    it('validateGameSetting should set invalid attribut to true and set invalidMessage if numberDiff too high', () => {
        component.disableSave();
        component.numberDiff = 20;
        component.validateGameSettings();
        expect(component.diffPopup.saveButton.nativeElement.disabled).toBeTrue();
        expect(component.invalid).toBeTrue();
        expect(component.invalidMessage).toEqual('Le nombre de différences est trop élevé. Il faut entre 3 et 9 différences.');
    });

    it('should call validate when validate button is clicked', () => {
        const validateSpy = spyOn(component, 'validate');
        const button = fixture.debugElement.query(By.css('#validate')).nativeElement;
        button.click();
        expect(validateSpy).toHaveBeenCalled();
    });

    it('validate should disable the save button', () => {
        const disableSaveSpy = spyOn(component, 'disableSave');
        component.validate();
        expect(disableSaveSpy).toHaveBeenCalled();
    });

    it('validate should call getDifferences, validateGameSettings and showDifferences', () => {
        const getDifferencesSpy = spyOn(component, 'getDifferences');
        component.imgDiffs = {} as ImageDiffs;
        component.imgDiffs.difficulty = 'test';
        component.validate();
        expect(getDifferencesSpy).toHaveBeenCalled();
    });

    it('isValidName should return false if gameName length is 0', () => {
        component.gameName = '';
        expect(component.isValidName()).toBeFalse();
    });

    it('isValidName should return false if gameName is invalid', () => {
        spyOn(window, 'alert');
        component.gameName = '';
        expect(component.isValidName()).toBeFalse();
        expect(window.alert).toHaveBeenCalledWith('Veuillez entrer un nom de jeu valide.');
    });

    it('save should be called when saveButton is clicked and button is activated', () => {
        const saveSpy = spyOn(component, 'save').and.returnValue(Promise.resolve());
        component.diffPopup.saveButton.nativeElement.disabled = false;
        component.diffPopup.saveButton.nativeElement.click();
        expect(saveSpy).toHaveBeenCalled();
    });

    it('save should not be called when saveButton is clicked and button is disabled', () => {
        const saveSpy = spyOn(component, 'save').and.returnValue(Promise.resolve());
        component.diffPopup.saveButton.nativeElement.disabled = true;
        component.diffPopup.saveButton.nativeElement.click();
        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('save should send createFiles request through storageService', (done) => {
        spyOn(component, 'isValidName').and.returnValue(true);
        component.mergedModified = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        component.mergedOriginal = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        component.gameLevel = testData.difficulty;
        component.numberDiff = testData.numberOfDifferences;
        component.gameName = testData.name;
        component.imgDiffs = { differences: testData.imgDiff, difficulty: testData.difficulty };
        component.creationService.originalImg = new File(['original,2'], 'filename', { type: 'image/bmp' });
        component.creationService.modifiedImg = new File(['modified,2'], 'filename2', { type: 'image/bmp' });
        spyOn(component.difHandler, 'getRecs').and.callFake(() => {
            return testData.differences;
        });
        spyOn(component, 'successfullyCreatedGame').and.returnValue();
        spyOn(storageService, 'createFiles').and.callFake(() => {
            component.successfullyCreatedGame();
            return of('done');
        });
        component.modifiedImageData = 'test';
        component.save().then(() => {
            expect(component.isValidName).toHaveBeenCalled();
            done();
        });
    });

    it('save should send nothing if gameName is invalid', (done) => {
        spyOn(component, 'isValidName').and.returnValue(false);

        component.save().then(() => {
            expect(component.isValidName).toHaveBeenCalled();
            done();
        });
    });

    it('processImage should disable the save button', () => {
        const disableSaveSpy = spyOn(component, 'disableSave');
        const mockFile: File = new File([''], 'filename', { type: 'image/png' });
        const mockEvent = { target: { files: [mockFile] } };
        const imgLocation = 'falseLocation';
        component.processImage(mockEvent as unknown as Event, imgLocation);
        expect(disableSaveSpy).toHaveBeenCalled();
    });

    it('successfullyCreatedGame should show message and navigate to configuration page', () => {
        spyOn(window, 'alert').and.returnValue();
        component.successfullyCreatedGame();
        expect(window.alert).toHaveBeenCalledWith('La création du jeu est un succès!');
        expect(component['router'].navigate).toHaveBeenCalledWith(['/config']);
    });

    it('isValidName should return false if regex does not match', () => {
        spyOn(window, 'alert').and.returnValue();
        component.gameName = 'TEST!';
        expect(component.isValidName()).toBeFalse();
    });

    it('isValidName should return true if regex matches', () => {
        spyOn(window, 'alert').and.returnValue();
        component.gameName = 'TEST';
        expect(component.isValidName()).toBeTrue();
    });

    it('should return true if event target is canvasOriginalZ2', () => {
        const fakeEvent1 = {
            target: component.canvasOriginalZ2.nativeElement,
        };

        expect(component.checkTarget(fakeEvent1 as unknown as MouseEvent)).toBeTrue();
    });

    it('should return true if event target is canvasModifiedZ2', () => {
        const fakeEvent2 = {
            target: component.canvasModifiedZ2.nativeElement,
        };

        expect(component.checkTarget(fakeEvent2 as unknown as MouseEvent)).toBeTrue();
    });

    it('should return false if event target is not canvasOriginalZ2 or canvasModifiedZ2', () => {
        const fakeEvent = {
            target: document.createElement('div'),
        };

        expect(component.checkTarget(fakeEvent as unknown as MouseEvent)).toBeFalse();
    });

    it('should return the correct canvas context canvasModifiedZ1', () => {
        const canvasOriginalZ1 = component.canvasOriginalZ1.nativeElement;
        const canvasModifiedZ1 = component.canvasModifiedZ1.nativeElement;
        const clickEvent = new MouseEvent('click');
        Object.defineProperty(clickEvent, 'target', { value: canvasOriginalZ1 });
        const result = component.getCorrectCanvas(clickEvent);

        expect(result).toEqual(canvasModifiedZ1.getContext('2d') as CanvasRenderingContext2D);
    });

    it('should return the correct canvas context canvasOriginalZ1', () => {
        const canvasOriginalZ1 = component.canvasOriginalZ1.nativeElement;
        const canvasOriginalZ2 = component.canvasOriginalZ2.nativeElement;

        const clickEvent = new MouseEvent('click');
        Object.defineProperty(clickEvent, 'target', { value: canvasOriginalZ2 });
        const result = component.getCorrectCanvas(clickEvent);

        expect(result).toEqual(canvasOriginalZ1.getContext('2d') as CanvasRenderingContext2D);
    });

    it('should return the correct canvas context canvasModifiedZ1', () => {
        const canvasModifiedZ1 = component.canvasModifiedZ1.nativeElement;

        const clickEvent1 = new MouseEvent('click');
        Object.defineProperty(clickEvent1, 'target', { value: canvasModifiedZ1 });
        const result1 = component.getCorrectCanvas(clickEvent1);

        expect(result1).toEqual(canvasModifiedZ1.getContext('2d') as CanvasRenderingContext2D);
    });

    it('should return the correct canvas context canvasOriginalZ2', () => {
        const canvasOriginalZ2 = component.canvasOriginalZ2.nativeElement;

        const clickEvent = new MouseEvent('click');
        Object.defineProperty(clickEvent, 'target', { value: canvasOriginalZ2 });
        const result = component.getCorrectCanvasForRec(clickEvent);

        expect(result).toEqual(canvasOriginalZ2.getContext('2d') as CanvasRenderingContext2D);
    });

    it('should return the correct canvas context canvasModifiedZ1', () => {
        const canvasModifiedZ1 = component.canvasModifiedZ1.nativeElement;

        const clickEvent1 = new MouseEvent('click');
        Object.defineProperty(clickEvent1, 'target', { value: canvasModifiedZ1 });
        const result1 = component.getCorrectCanvasForRec(clickEvent1);

        expect(result1).toEqual(canvasModifiedZ1.getContext('2d') as CanvasRenderingContext2D);
    });
});
