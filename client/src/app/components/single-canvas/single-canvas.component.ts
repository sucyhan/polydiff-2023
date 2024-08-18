import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
    selector: 'app-single-canvas',
    templateUrl: './single-canvas.component.html',
    styleUrls: ['./single-canvas.component.scss'],
})
export class SingleCanvasComponent implements AfterViewInit {
    @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
    @Input() layer: string = '';
    @Input() index: number = 0;

    ngAfterViewInit(): void {
        this.canvas.nativeElement.style.zIndex = this.index.toString();
    }
}
