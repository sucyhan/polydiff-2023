import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PlayerInfo } from '@common/interfaces';
import { HistoryPopupComponent } from './history-popup.component';

describe('HistoryPopupComponent', () => {
    let component: HistoryPopupComponent;
    let fixture: ComponentFixture<HistoryPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatIconModule, FormsModule],
            declarations: [HistoryPopupComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(HistoryPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('close should set showPopup to false', () => {
        component.close();
        expect(component.showPopup).toBeFalse();
    });

    it('search should set usedData to historyData', () => {
        component.name = '';
        component.historyData = [];
        component.search();
        expect(component.usedData.length).toEqual(component.historyData.length);
    });

    it('search should set usedData to less than historyData', () => {
        component.name = 'e';
        component.historyData = [];
        component.search();
        expect(component.usedData.length).toEqual(component.historyData.length);
    });

    it('search should set usedData to less than historyData and find a name for player 1', () => {
        component.name = 'e';
        const player1: PlayerInfo = {
            name: 'enrique',
            isWinner: true,
            isQuitter: false,
        };
        const player2: PlayerInfo = {
            name: 'anne',
            isWinner: false,
            isQuitter: false,
        };
        component.historyData = [
            {
                date: 'today',
                duration: 4,
                mode: 'solo',
                player1,
                player2,
            },
        ];
        component.search();
        expect(component.usedData.length).toEqual(component.historyData.length);
    });

    it('search should set usedData to less than historyData and find a name for player 2', () => {
        component.name = 'a';
        const player1: PlayerInfo = {
            name: 'enrique',
            isWinner: true,
            isQuitter: false,
        };
        const player2: PlayerInfo = {
            name: 'anne',
            isWinner: false,
            isQuitter: false,
        };
        component.historyData = [
            {
                date: 'today',
                duration: 4,
                mode: 'solo',
                player1,
                player2,
            },
        ];
        component.search();
        expect(component.usedData.length).toEqual(component.historyData.length);
    });

    it('delete should emit deleteHistory event', () => {
        const emitSpy = spyOn(EventEmitter.prototype, 'emit');
        component.delete();
        expect(emitSpy).toHaveBeenCalledOnceWith('deleteAll');
    });
});
