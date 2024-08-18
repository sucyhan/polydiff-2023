import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
import { COLOR, DEFAULT_PEN_SIZE } from '@common/constants';

@Component({
    selector: 'app-tool-box',
    templateUrl: './tool-box.component.html',
    styleUrls: ['./tool-box.component.scss'],
})
export class ToolBoxComponent implements AfterViewInit {
    @Output() radiusChanged = new EventEmitter<string>();
    @Output() colorChanged = new EventEmitter<string>();
    @Output() undoEvent = new EventEmitter<string>();
    @Output() redoEvent = new EventEmitter<string>();
    @Output() selectRectangles = new EventEmitter<string>();
    @Output() selectDraw = new EventEmitter<string>();
    @Output() selectEraser = new EventEmitter<string>();
    @Output() resetEvent = new EventEmitter<string>();
    @Output() swapEvent = new EventEmitter<string>();

    selectedColor: COLOR = COLOR.black;
    color: string = '#0000';
    selectedSize: number = DEFAULT_PEN_SIZE;

    ngAfterViewInit(): void {
        this.selectOption(document.getElementById('draw') as HTMLElement);
    }

    sliderOnChange(radius: number) {
        this.selectedSize = radius;
        this.radiusChanged.emit('Radius Changed');
    }

    colorOnChange(newColor: string) {
        this.color = newColor;
        this.colorChanged.emit('COLOR changed');
    }

    selectColor(newColor: string) {
        this.selectedColor = COLOR[newColor as keyof typeof COLOR];
        this.colorChanged.emit('COLOR changed');
    }

    selectOption(element: HTMLElement) {
        element.classList.add('selected');
    }

    unselectOption(element: HTMLElement) {
        element.classList.remove('selected');
    }

    unselectAllOptions() {
        this.unselectOption(document.getElementById('erase') as HTMLElement);
        this.unselectOption(document.getElementById('draw') as HTMLElement);
        this.unselectOption(document.getElementById('rectangle') as HTMLElement);
    }

    erase() {
        this.selectOption(document.getElementById('erase') as HTMLElement);
        this.unselectOption(document.getElementById('draw') as HTMLElement);
        this.unselectOption(document.getElementById('rectangle') as HTMLElement);
        this.selectEraser.emit('Eraser Selected');
    }

    draw() {
        this.selectOption(document.getElementById('draw') as HTMLElement);
        this.unselectOption(document.getElementById('erase') as HTMLElement);
        this.unselectOption(document.getElementById('rectangle') as HTMLElement);
        this.selectDraw.emit('Draw Selected');
    }

    createRectangle() {
        this.selectOption(document.getElementById('rectangle') as HTMLElement);
        this.unselectOption(document.getElementById('erase') as HTMLElement);
        this.unselectOption(document.getElementById('draw') as HTMLElement);
        this.selectRectangles.emit('Rectangle Selected');
    }

    undo() {
        this.undoEvent.emit('Undo');
    }

    redo() {
        this.redoEvent.emit('Redo');
    }

    reset() {
        this.resetEvent.emit('Reset');
    }

    swap() {
        this.swapEvent.emit('Swap');
    }
}
