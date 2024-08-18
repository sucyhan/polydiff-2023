import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ClientSocketHandlerService } from '@app/services/client-socket-handler.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ClientWaitingObject } from '@common/interfaces';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';

import { JoinGamePopupComponent } from './join-game-popup.component';

class MockSocketClientService extends SocketClientService {
    // needed for mocking socket.send while keeping the same signature
    // eslint-disable-next-line no-unused-vars
    override send<T>(event: string, data?: T) {
        return;
    }
}

class MockClientSocketHandlerService {
    waitingObjectChanged = new Subject<ClientWaitingObject>();
}

describe('JoinGamePopupComponent', () => {
    let component: JoinGamePopupComponent;
    let fixture: ComponentFixture<JoinGamePopupComponent>;
    let socketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketClientService = new MockSocketClientService();
        socketClientService.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [JoinGamePopupComponent],
            imports: [MatIconModule],
            providers: [
                { provide: SocketClientService, useValue: new MockSocketClientService() },
                { provide: ClientSocketHandlerService, useValue: new MockClientSocketHandlerService() },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinGamePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngAfterViewInit should subscribe to waitingObjectChange and set popUp attributes', () => {
        const waitingObject: ClientWaitingObject = {
            gameId: 0,
            playerName: 'player',
            opponentName: 'opponent',
            creatorName: 'creator',
            isCreator: false,
            newOpponent: false,
            isWaiting: true,
            waitingMessage: 'waiting',
        };
        component['socketHandler'].waitingObjectChanged.next(waitingObject);
        expect(component.creatorName).toEqual(waitingObject.opponentName);
        expect(component.currentPlayer).toEqual(waitingObject.opponentName);
        expect(component.isWaiting).toEqual(waitingObject.isWaiting);
        expect(component.gameId).toEqual(waitingObject.gameId);
        expect(component.waitingMessage).toEqual(waitingObject.waitingMessage);
    });

    it('close should set showPopup to false, emit showPopupChange and not call send on socket if isWaiting is false', () => {
        const emitSpy = spyOn(EventEmitter.prototype, 'emit').and.returnValue();
        const sendSpy = spyOn(component['socketClient'], 'send');
        component.isWaiting = false;
        component.close();
        expect(component.showPopup).toBeFalse();
        expect(emitSpy).toHaveBeenCalledWith(component.showPopup);
        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('close should set showPopup to false, emit showPopupChange and call send on socket if isWaiting is true', () => {
        const emitSpy = spyOn(EventEmitter.prototype, 'emit').and.returnValue();
        const sendSpy = spyOn(component['socketClient'], 'send');
        component.isWaiting = true;
        component.gameId = 0;
        component.close();
        expect(component.showPopup).toBeFalse();
        expect(emitSpy).toHaveBeenCalledWith(component.showPopup);
        expect(sendSpy).toHaveBeenCalledWith('quitLine', 1);
    });
});
