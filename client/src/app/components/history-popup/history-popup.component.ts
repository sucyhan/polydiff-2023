import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { HistoryData } from '@common/interfaces';

@Component({
    selector: 'app-history-popup',
    templateUrl: './history-popup.component.html',
    styleUrls: ['./history-popup.component.scss'],
})
export class HistoryPopupComponent {
    @Input() historyData: HistoryData[];
    @Input() usedData: HistoryData[];
    @Input() showPopup: boolean = false;
    @Output() showPopupChange = new EventEmitter<boolean>();
    @Output() deleteHistory = new EventEmitter<string>();
    @ViewChild('Search') searchInput = ElementRef<HTMLInputElement>;
    name: string;
    readonly icon: string = 'close';

    close() {
        this.showPopup = false;
        this.showPopupChange.emit(this.showPopup);
    }

    search() {
        if (this.name === '') {
            this.usedData = this.historyData;
        } else {
            this.findHistoryByName();
        }
    }

    delete() {
        this.deleteHistory.emit('deleteAll');
    }

    private findHistoryByName() {
        this.usedData = [];
        for (const game of this.historyData) {
            if (game.player1.name.includes(this.name) || game.player2.name.includes(this.name)) {
                this.usedData.push(game);
            }
        }
    }
}
