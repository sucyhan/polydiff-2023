import { ElementRef, Injectable } from '@angular/core';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, HEADER_CONVERT_BASE, HEADER_LENGTH, VALID_HEADER } from '@common/constants';

@Injectable({
    providedIn: 'root',
})
export class CreationService {
    originalImg: File;
    modifiedImg: File;
    baseImg: File;

    originalContext: CanvasRenderingContext2D;
    originalContextZ1: CanvasRenderingContext2D;
    originalContextZ2: CanvasRenderingContext2D;

    modifiedContext: CanvasRenderingContext2D;
    modifiedContextZ1: CanvasRenderingContext2D;
    modifiedContextZ2: CanvasRenderingContext2D;

    originalImageSrc: string = '';
    modifiedImageSrc: string = '';

    initializeImg(imgLocation: string) {
        this.displayImg(this.baseImg, imgLocation);
    }

    createMergedCanvas(canvas: ElementRef<HTMLCanvasElement>, canvasZ1: ElementRef<HTMLCanvasElement>): HTMLCanvasElement {
        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = DEFAULT_WIDTH;
        mergedCanvas.height = DEFAULT_HEIGHT;
        const mergedCtx: CanvasRenderingContext2D = mergedCanvas.getContext('2d') as CanvasRenderingContext2D;
        mergedCtx.drawImage(canvas.nativeElement, 0, 0);
        mergedCtx.drawImage(canvasZ1.nativeElement, 0, 0);
        return mergedCanvas;
    }

    async processImage(event: Event, imgLocation: string) {
        const isValid = await this.isValidType(event).then((resolve) => {
            return resolve;
        });
        if (isValid) {
            const target = event.target as HTMLInputElement;
            if (target.files) {
                this.displayImg(target.files[0], imgLocation);
            }
        } else {
            window.alert("Le format de l'image est invalide. L'image doit être une bitmap 24 bits.");
        }
    }
    async displayImg(file: File, imgLocation: string): Promise<void> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            const imgSrc = window.URL.createObjectURL(file);
            reader.onload = async () => {
                this.selectCanvas(file, imgLocation, imgSrc);
                resolve();
            };
        });
    }

    setUpCanvas(newCanvas: ElementRef<HTMLCanvasElement>): HTMLCanvasElement {
        const canvas: HTMLCanvasElement = newCanvas.nativeElement;
        canvas.width = DEFAULT_WIDTH;
        canvas.height = DEFAULT_HEIGHT;
        return canvas;
    }

    setUpContexts(gameOriginal: ElementRef<HTMLCanvasElement>, gameModified: ElementRef<HTMLCanvasElement>, plan?: string) {
        const originalCanvas: HTMLCanvasElement = this.setUpCanvas(gameOriginal);
        const modifiedCanvas: HTMLCanvasElement = this.setUpCanvas(gameModified);

        switch (plan) {
            case 'Z1': {
                this.originalContextZ1 = originalCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
                this.modifiedContextZ1 = modifiedCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

                break;
            }
            case 'Z2': {
                this.originalContextZ2 = originalCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
                this.modifiedContextZ2 = modifiedCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

                break;
            }
            default: {
                this.originalContext = originalCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
                this.modifiedContext = modifiedCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

                break;
            }
        }
    }

    private async isValidType(event: Event) {
        return new Promise<boolean>((resolve) => {
            const fileReader = new FileReader();
            const target = event.target as HTMLInputElement;
            if (target.files) {
                fileReader.readAsArrayBuffer(target.files[0]);
            }
            fileReader.onloadend = async () => {
                let fileHeader = '';
                const array = new Uint8Array(fileReader.result as ArrayBufferLike).subarray(0, HEADER_LENGTH);
                for (const elem of array) {
                    fileHeader += elem.toString(HEADER_CONVERT_BASE);
                }
                resolve(fileHeader === VALID_HEADER);
            };
        });
    }

    private selectCanvas(file: File, imgLocation: string, imgSrc: string) {
        if (imgLocation === 'original') {
            this.drawImage(this.originalContext, imgSrc);
            this.originalImg = file;
        } else if (imgLocation === 'modified') {
            this.drawImage(this.modifiedContext, imgSrc);
            this.modifiedImg = file;
        } else {
            this.drawImage(this.modifiedContext, imgSrc);
            this.drawImage(this.originalContext, imgSrc);
            this.modifiedImg = file;
            this.originalImg = file;
        }
    }

    private async drawImage(canvasContext: CanvasRenderingContext2D, imgSrc: string): Promise<void> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = async () => {
                if (this.isValidSize(img)) {
                    canvasContext.drawImage(img, 0, 0);
                }
                resolve();
            };
            img.src = imgSrc;
        });
    }

    private isValidSize(img: HTMLImageElement): boolean {
        if (img.width !== DEFAULT_WIDTH || img.height !== DEFAULT_HEIGHT) {
            window.alert("La taille de l'image est invalide. L'image doit être de 640 par 480 pixels");
            return false;
        }
        return true;
    }
}
