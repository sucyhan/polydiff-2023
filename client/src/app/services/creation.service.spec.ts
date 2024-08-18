import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, EMPTY_IMG_SRC } from '@common/constants';
import { PrivateFunction } from '@common/interfaces';
import { CreationService } from './creation.service';

describe('CreationService', () => {
    let service: CreationService;
    let ctxStub: CanvasRenderingContext2D;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CreationService);
        ctxStub = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        service.originalContext = ctxStub;
        service.modifiedContext = ctxStub;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('initializeImg should call displayImg with baseImg and imgLocation', () => {
        const displayImgSpy = spyOn<PrivateFunction>(service, 'displayImg').and.returnValue(null);
        const imgLocation = 'original';
        service.baseImg = new File([''], 'filename', { type: 'image/bmp' });
        service.initializeImg(imgLocation);
        expect(displayImgSpy).toHaveBeenCalled();
        expect(displayImgSpy).toHaveBeenCalledOnceWith(service.baseImg, imgLocation);
    });

    it('createMergedCanvas should return a canvas with the two canvas drawn on it', () => {
        const drawSpy = spyOn(CanvasRenderingContext2D.prototype, 'drawImage').and.returnValue();
        const canvas = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasElem = new ElementRef(canvas);
        const canvasZ1 = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasZ1Elem = new ElementRef(canvasZ1);
        const mergedCanvas = service.createMergedCanvas(canvasElem, canvasZ1Elem);
        expect(mergedCanvas.width).toBe(DEFAULT_WIDTH);
        expect(mergedCanvas.height).toBe(DEFAULT_HEIGHT);
        expect(drawSpy).toHaveBeenCalledTimes(2);
    });

    it('processImage should call isValidType and displayImg if the file is valid', (done) => {
        const isValidTypeSpy = spyOn<PrivateFunction>(service, 'isValidType').and.returnValue(Promise.resolve(true));
        const displayImgSpy = spyOn<PrivateFunction>(service, 'displayImg').and.returnValue(null);
        const imgLocation = 'original';
        const mockFile: File = new File([''], 'filename', { type: 'image/bmp' });
        const mockEvent = { target: { files: [mockFile] } };
        service.processImage(mockEvent as unknown as Event, imgLocation).then(() => {
            expect(isValidTypeSpy).toHaveBeenCalled();
            expect(displayImgSpy).toHaveBeenCalled();
            expect(displayImgSpy).toHaveBeenCalledOnceWith(mockFile, imgLocation);
            done();
        });
    });

    it('processImage should call isValidType, but not displayImg if the file type is invalid', (done) => {
        spyOn(window, 'alert');
        const isValidTypeSpy = spyOn<PrivateFunction>(service, 'isValidType').and.returnValue(Promise.resolve(false));
        const displayImgSpy = spyOn<PrivateFunction>(service, 'displayImg').and.returnValue(null);
        const imgLocation = 'original';
        const mockFile: File = new File([''], 'filename', { type: 'image/png' });
        const mockEvent = { target: { files: [mockFile] } };
        service.processImage(mockEvent as unknown as Event, imgLocation).then(() => {
            expect(isValidTypeSpy).toHaveBeenCalled();
            expect(displayImgSpy).not.toHaveBeenCalled();
            expect(window.alert).toHaveBeenCalledWith("Le format de l'image est invalide. L'image doit être une bitmap 24 bits.");
            done();
        });
    });

    it('processImage should not call displayImg if the file is undefined', (done) => {
        const isValidTypeSpy = spyOn<PrivateFunction>(service, 'isValidType').and.returnValue(Promise.resolve(true));
        const displayImgSpy = spyOn<PrivateFunction>(service, 'displayImg').and.returnValue(null);
        const imgLocation = 'original';
        const mockEvent = { target: { files: undefined } };
        service.processImage(mockEvent as unknown as Event, imgLocation).then(() => {
            expect(isValidTypeSpy).toHaveBeenCalled();
            expect(displayImgSpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('displayImg should call selectCanvas with file, imgLocation and imgSrc', (done) => {
        const selectCanvasSpy = spyOn<PrivateFunction>(service, 'selectCanvas').and.returnValue(null);
        spyOn(window.URL, 'createObjectURL').and.returnValue('');
        const imgLocation = 'original';
        const mockFile: File = new File([''], 'filename', { type: 'image/bmp' });
        service.displayImg(mockFile, imgLocation).then(() => {
            expect(selectCanvasSpy).toHaveBeenCalled();
            expect(selectCanvasSpy).toHaveBeenCalledOnceWith(mockFile, imgLocation, '');
            done();
        });
    });

    it('setUpCanvas should set canvas width and height to DEFAULT_WIDTH and DEFAULT_HEIGHT', () => {
        const canvas = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const canvasElem = new ElementRef<HTMLCanvasElement>(canvas);
        service.setUpCanvas(canvasElem);
        expect(canvas.width).toBe(DEFAULT_WIDTH);
        expect(canvas.height).toBe(DEFAULT_HEIGHT);
    });

    it('setUpContexts should call setUpCanvas on both canvas', () => {
        const mockCanvas = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const setUpCanvasSpy = spyOn(service, 'setUpCanvas').and.returnValue(mockCanvas);
        const canvasElem = new ElementRef<HTMLCanvasElement>(mockCanvas);
        service.setUpContexts(canvasElem, canvasElem);
        expect(setUpCanvasSpy).toHaveBeenCalledTimes(2);
    });

    it('setUpContexts should set originalContext and modifiedContext to the canvas context is plan is undefined', () => {
        const mockCanvas = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const setUpCanvasSpy = spyOn(service, 'setUpCanvas').and.returnValue(mockCanvas);
        const canvasElem = new ElementRef<HTMLCanvasElement>(mockCanvas);
        service.setUpContexts(canvasElem, canvasElem);
        expect(setUpCanvasSpy).toHaveBeenCalledTimes(2);
        expect(service.originalContext).toEqual(mockCanvas.getContext('2d') as CanvasRenderingContext2D);
        expect(service.modifiedContext).toEqual(mockCanvas.getContext('2d') as CanvasRenderingContext2D);
    });

    it('setUpContexts should set originalContextZ1 and modifiedContextZ1 to the canvas context is plan is Z1', () => {
        const mockCanvas = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const setUpCanvasSpy = spyOn(service, 'setUpCanvas').and.returnValue(mockCanvas);
        const canvasElem = new ElementRef<HTMLCanvasElement>(mockCanvas);
        service.setUpContexts(canvasElem, canvasElem, 'Z1');
        expect(setUpCanvasSpy).toHaveBeenCalledTimes(2);
        expect(service.originalContextZ1).toEqual(mockCanvas.getContext('2d') as CanvasRenderingContext2D);
        expect(service.modifiedContextZ1).toEqual(mockCanvas.getContext('2d') as CanvasRenderingContext2D);
    });

    it('setUpContexts should set originalContextZ2 and modifiedContextZ2 to the canvas context is plan is Z2', () => {
        const mockCanvas = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const setUpCanvasSpy = spyOn(service, 'setUpCanvas').and.returnValue(mockCanvas);
        const canvasElem = new ElementRef<HTMLCanvasElement>(mockCanvas);
        service.setUpContexts(canvasElem, canvasElem, 'Z2');
        expect(setUpCanvasSpy).toHaveBeenCalledTimes(2);
        expect(service.originalContextZ2).toEqual(mockCanvas.getContext('2d') as CanvasRenderingContext2D);
        expect(service.modifiedContextZ2).toEqual(mockCanvas.getContext('2d') as CanvasRenderingContext2D);
    });

    it('isValidType should return true if the file is a bitmap 24 bits', async () => {
        const blob = await fetch(EMPTY_IMG_SRC).then(async (resolve) => resolve.blob());
        const mockFile: File = new File([blob], 'filename', { type: 'image/bmp' });
        const mockEvent = { target: { files: [mockFile] } };
        const result = await service['isValidType'](mockEvent as unknown as Event);
        expect(result).toBe(true);
    });

    it('isValidType should return false if the file is not a bitmap 24 bits', (done) => {
        const mockFile: File = new File([''], 'filename', { type: 'image/png' });
        const mockEvent = { target: { files: [mockFile] } };
        service['isValidType'](mockEvent as unknown as Event).then((resolve) => {
            expect(resolve).toBe(false);
            done();
        });
    });

    it('selectCanvas should call addImage with canvasOriginal if imgLocation is original and set originalImg', () => {
        const drawImageSpy = spyOn<PrivateFunction>(service, 'drawImage').and.returnValue(null);
        const imgLocation = 'original';
        const imgSrc = '';
        const mockFile: File = new File([''], 'filename', { type: 'text/html' });
        service['selectCanvas'](mockFile, imgLocation, imgSrc);
        expect(drawImageSpy).toHaveBeenCalled();
        expect(drawImageSpy).toHaveBeenCalledOnceWith(service.originalContext, imgSrc);
        expect(service.originalImg).toBe(mockFile);
    });

    it('selectCanvas should call addImage with canvasModified if imgLocation is modified and set modifiedImg', () => {
        const drawImageSpy = spyOn<PrivateFunction>(service, 'drawImage').and.returnValue(null);
        const imgLocation = 'modified';
        const imgSrc = '';
        const mockFile: File = new File([''], 'filename', { type: 'text/html' });
        service['selectCanvas'](mockFile, imgLocation, imgSrc);
        expect(drawImageSpy).toHaveBeenCalled();
        expect(drawImageSpy).toHaveBeenCalledOnceWith(service.modifiedContext, imgSrc);
        expect(service.modifiedImg).toBe(mockFile);
    });

    it('selectCanvas should call addImage with both canvas if imgLocation is emptyString and set originalImg and modifiedImg', () => {
        const drawImageSpy = spyOn<PrivateFunction>(service, 'drawImage').and.returnValue(null);
        const imgLocation = '';
        const imgSrc = '';
        const mockFile: File = new File([''], 'filename', { type: 'text/html' });
        service['selectCanvas'](mockFile, imgLocation, imgSrc);
        expect(drawImageSpy).toHaveBeenCalledWith(service.originalContext, imgSrc);
        expect(drawImageSpy).toHaveBeenCalledWith(service.modifiedContext, imgSrc);
        expect(service.originalImg).toBe(mockFile);
        expect(service.modifiedImg).toBe(mockFile);
    });

    it('drawImage should draw image if size is valid', (done) => {
        spyOn<PrivateFunction>(service, 'isValidSize').and.returnValue(true);
        spyOn(CanvasRenderingContext2D.prototype, 'drawImage').and.returnValue();
        const imgSrc = 'assets/image_empty.bmp';
        service['drawImage'](ctxStub, imgSrc).then(() => {
            expect(service['isValidSize']).toHaveBeenCalled();
            expect(ctxStub.drawImage).toHaveBeenCalled();
            done();
        });
    });

    it('drawImage should draw image if size is invalid', (done) => {
        spyOn<PrivateFunction>(service, 'isValidSize').and.returnValue(false);
        spyOn(CanvasRenderingContext2D.prototype, 'drawImage').and.returnValue();
        const imgSrc = 'assets/image_empty.bmp';
        service['drawImage'](ctxStub, imgSrc).then(() => {
            expect(service['isValidSize']).toHaveBeenCalled();
            expect(ctxStub.drawImage).not.toHaveBeenCalled();
            done();
        });
    });

    it('isValidSize should return true if image is 640 by 480', () => {
        spyOn(window, 'alert');
        const mockImg = new Image(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const returnValue = service['isValidSize'](mockImg);
        expect(window.alert).not.toHaveBeenCalled();
        expect(returnValue).toBeTrue();
    });

    it('isValidSize should send window alert and return false if image is not 640 by 480', () => {
        spyOn(window, 'alert');
        const mockImg = new Image(DEFAULT_WIDTH - 1, DEFAULT_HEIGHT - 1);
        const returnValue = service['isValidSize'](mockImg);
        expect(window.alert).toHaveBeenCalledWith("La taille de l'image est invalide. L'image doit être de 640 par 480 pixels");
        expect(returnValue).toBeFalse();
    });
});
