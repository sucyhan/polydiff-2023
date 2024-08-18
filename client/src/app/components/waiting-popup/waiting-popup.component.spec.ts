import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ClientSocketHandlerService } from '@app/services/client-socket-handler.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GAME_TIMER_MODE } from '@common/constants';
import { ClientWaitingObject, PrivateFunction } from '@common/interfaces';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { WaitingPopupComponent } from './waiting-popup.component';

class MockSocketClientService extends SocketClientService {
    // needed for mocking socket.send while keeping the same signature
    // eslint-disable-next-line no-unused-vars
    override send<T>(event: string, data?: T) {
        return;
    }
    override connect(): void {
        return;
    }
}

class MockClientSocketHandlerService {
    waitingObject: ClientWaitingObject = {
        gameId: 0,
        playerName: 'player',
        opponentName: 'opponent',
        creatorName: 'creator',
        isCreator: false,
        newOpponent: false,
        isWaiting: true,
        waitingMessage: 'waiting',
    };

    waitingObjectChanged = new Subject<ClientWaitingObject>();
}

describe('WaitingPopupComponent', () => {
    let component: WaitingPopupComponent;
    let fixture: ComponentFixture<WaitingPopupComponent>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [WaitingPopupComponent],
            imports: [MatIconModule],
            providers: [
                { provide: SocketClientService, useValue: socketClientServiceMock },
                { provide: ClientSocketHandlerService, useValue: new MockClientSocketHandlerService() },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnChanges should call setMessages', () => {
        const setMessagesSpy = spyOn<PrivateFunction>(component, 'setMessages');
        component.ngOnChanges();
        expect(setMessagesSpy).toHaveBeenCalled();
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
        component.ngAfterViewInit();
        component['socketHandler'].waitingObjectChanged.next(waitingObject);
        expect(component.currentPlayer).toEqual(waitingObject.creatorName);
        expect(component.opponentName).toEqual(waitingObject.opponentName);
        expect(component.newOpponent).toEqual(waitingObject.newOpponent);
        expect(component.isCreator).toEqual(waitingObject.isCreator);
    });

    it('setMessages should set the waitingMessage', () => {
        component['setMessages']();
        expect(component.waitingMessage).toEqual("En attente d'un adversaire");
    });

    it('reject should set newOpponent to false, emit newOpponentOffer event and send rejected', () => {
        const emitSpy = spyOn(EventEmitter.prototype, 'emit').and.returnValue();
        const sendSpy = spyOn(component['socketClient'], 'send');
        component.gameId = 0;
        component.reject();
        expect(component.newOpponent).toEqual(false);
        expect(emitSpy).toHaveBeenCalledWith('rejected');
        expect(sendSpy).toHaveBeenCalledWith('rejected', 1);
    });

    it('accept should set showPopup to false, emit newOpponentOffer event and send accepted', () => {
        const emitSpy = spyOn(EventEmitter.prototype, 'emit').and.returnValue();
        const sendSpy = spyOn(component['socketClient'], 'send');
        component.currentPlayer = 'test';
        component.gameId = 0;
        component.accept();
        expect(component.showPopup).toEqual(false);
        expect(emitSpy).toHaveBeenCalledWith('accepted');
        expect(sendSpy).toHaveBeenCalledWith('accepted', [GAME_TIMER_MODE.CLASSIC, 1, 'test']);
    });

    it('close should set showPopup to false and send deleteWaitingRoom if showPopup', () => {
        const sendSpy = spyOn(component['socketClient'], 'send');
        component.showPopup = true;
        component.gameId = 0;
        component.close();
        expect(component.showPopup).toEqual(false);
        expect(sendSpy).toHaveBeenCalledWith('deleteWaitingRoom', 1);
    });

    it('close should set showPopup to false and send deleteWaitingRoom if showPopup', () => {
        const sendSpy = spyOn(component['socketClient'], 'send');
        component.showPopup = false;
        component.gameId = 0;
        component.close();
        expect(component.showPopup).toEqual(false);
        expect(sendSpy).not.toHaveBeenCalledWith('deleteWaitingRoom', 1);
    });
});
