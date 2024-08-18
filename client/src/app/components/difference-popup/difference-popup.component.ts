import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-difference-popup',
    templateUrl: './difference-popup.component.html',
    styleUrls: ['./difference-popup.component.scss'],
})
export class DifferencePopupComponent {
    @Input() showPopup: boolean = true;
    @Output() showPopupChange = new EventEmitter<boolean>();

    @Input() numberDiff: number = 0;
    @Input() gameLevel: string = '';
    @Input() invalid: boolean = false;
    @Input() invalidMessage: string = '';
    @Input() gameName: string = '';
    @Output() gameNameChange = new EventEmitter<string>();
    @Output() selectSave = new EventEmitter<string>();
    @ViewChild('Difference') canvasDifference: ElementRef<HTMLCanvasElement>;
    @ViewChild('Save') saveButton: ElementRef<HTMLButtonElement>;

    readonly icon: string = 'close';

    hideDifference() {
        this.showPopup = false;
        this.showPopupChange.emit(this.showPopup);
    }

    save() {
        this.gameNameChange.emit(this.gameName);
        this.selectSave.emit('saved');
    }
}
