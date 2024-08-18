import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { UserWaiting } from '@common/interfaces';
import { ClientSocketHandlerService } from './client-socket-handler.service';
import { SocketClientService } from './socket-client.service';

describe('ClientSocketHandlerService', () => {
    let service: ClientSocketHandlerService;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [{ provide: SocketClientService, useValue: socketHelper }],
        });
        service = TestBed.inject(ClientSocketHandlerService);
        service.waitingObject = {
            gameId: 0,
            playerName: '',
            opponentName: '',
            creatorName: '',
            isCreator: true,
            newOpponent: false,
            isWaiting: false,
            waitingMessage: '',
        };
        spyOn(service['router'], 'navigate').and.returnValue(Promise.resolve(true));
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('handleSocket on nextOpponent should update waitingObjectChanged with new opponent data', () => {
        spyOn(service.waitingObjectChanged, 'next').and.returnValue();
        const user: UserWaiting = { socketId: 'id', userName: 'player1' };
        service.handleSocket();
        socketHelper.peerSideEmit('nextOpponent', user);
        expect(service.waitingObject.newOpponent).toBeTrue();
        expect(service.waitingObject.opponentName).toEqual('player1');
        expect(service.waitingObjectChanged.next).toHaveBeenCalledWith(service.waitingObject);
    });

    it('handleSocket on joined should update waitingObjectChanged with new data', () => {
        spyOn(service.waitingObjectChanged, 'next').and.returnValue();
        service.handleSocket();
        socketHelper.peerSideEmit('joined');
        expect(service.waitingObject.isWaiting).toBeTrue();
        expect(service.waitingObject.waitingMessage).toEqual('En attente de la réponse du créateur');
        expect(service.waitingObjectChanged.next).toHaveBeenCalledWith(service.waitingObject);
    });

    it('handleSocket on deletedRoom should update waitingObjectChanged with new data', () => {
        spyOn(service.waitingObjectChanged, 'next').and.returnValue();
        service.handleSocket();
        socketHelper.peerSideEmit('deletedRoom');
        expect(service.waitingObject.isWaiting).toBeFalse();
        expect(service.waitingObject.waitingMessage).toEqual('Désolé, le créateur a annulé la partie.');
        expect(service.waitingObjectChanged.next).toHaveBeenCalledWith(service.waitingObject);
    });

    it('handleSocket on roomClosed should update waitingObjectChanged with new data', () => {
        spyOn(service.waitingObjectChanged, 'next').and.returnValue();
        spyOn(service.socketClient, 'send').and.returnValue();
        service.handleSocket();
        socketHelper.peerSideEmit('roomClosed', 1);
        expect(service.socketClient.send).toHaveBeenCalledWith('leaveRoom', '1');
        expect(service.waitingObject.isWaiting).toBeFalse();
        expect(service.waitingObject.waitingMessage).toEqual('Désolé, le créateur a annulé la partie.');
        expect(service.waitingObjectChanged.next).toHaveBeenCalledWith(service.waitingObject);
    });

    it('handleSocket on rejected should update waitingObjectChanged with new data', () => {
        spyOn(service.waitingObjectChanged, 'next').and.returnValue();
        spyOn(service.socketClient, 'send').and.returnValue();
        service.handleSocket();
        socketHelper.peerSideEmit('rejected', 1);
        expect(service.socketClient.send).toHaveBeenCalledWith('leaveRoom', '1');
        expect(service.waitingObject.isWaiting).toBeFalse();
        expect(service.waitingObject.waitingMessage).toEqual('Désolé, le créateur vous a rejeté.');
        expect(service.waitingObjectChanged.next).toHaveBeenCalledWith(service.waitingObject);
    });

    it('handleSocket on accepted should update waitingObjectChanged with new data and navigate to game', () => {
        spyOn(service.waitingObjectChanged, 'next').and.returnValue();
        service.handleSocket();
        socketHelper.peerSideEmit('accepted', 'link');
        expect(service['router'].navigate).toHaveBeenCalledWith(['link'], { skipLocationChange: true });
        expect(service.waitingObjectChanged.next).toHaveBeenCalledWith(service.waitingObject);
    });

    it('handleSocket on emptyLine should update waitingObjectChanged with new data', () => {
        spyOn(service.waitingObjectChanged, 'next').and.returnValue();
        service.handleSocket();
        socketHelper.peerSideEmit('emptyLine');
        expect(service.waitingObject.newOpponent).toBeFalse();
        expect(service.waitingObjectChanged.next).toHaveBeenCalledWith(service.waitingObject);
    });

    it('handleSocket on deletedFromServer should alert and navigate to home', () => {
        const windowSpy = spyOn(window, 'alert').and.returnValue();
        spyOn(service['router'], 'navigateByUrl').and.returnValue(Promise.resolve(true));
        service.handleSocket();
        socketHelper.peerSideEmit('deletedFromServer');
        expect(windowSpy).toHaveBeenCalled();
        expect(service['router'].navigateByUrl).toHaveBeenCalledWith('/', { skipLocationChange: true });
    });

    it('reset should reset waitingObject', () => {
        service.waitingObject = {
            gameId: 1,
            playerName: 'player1',
            opponentName: 'player2',
            creatorName: 'player3',
            isCreator: true,
            newOpponent: true,
            isWaiting: true,
            waitingMessage: 'message',
        };
        service.reset();
        expect(service.waitingObject).toEqual({
            gameId: 0,
            playerName: '',
            opponentName: '',
            creatorName: '',
            isCreator: true,
            newOpponent: false,
            isWaiting: false,
            waitingMessage: '',
        });
    });
});
