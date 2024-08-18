import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ClientWaitingObject, UserWaiting } from '@common/interfaces';
import { Subject } from 'rxjs';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class ClientSocketHandlerService {
    waitingObject: ClientWaitingObject = {
        gameId: 0,
        playerName: '',
        opponentName: '',
        creatorName: '',
        isCreator: true,
        newOpponent: false,
        isWaiting: false,
        waitingMessage: '',
    };

    waitingObjectChanged = new Subject<ClientWaitingObject>();

    constructor(private readonly router: Router, readonly socketClient: SocketClientService) {}

    handleSocket() {
        this.socketClient.connect();

        this.socketClient.on('joined', () => {
            this.waitingObject.waitingMessage = 'En attente de la réponse du créateur';
            this.waitingObject.isWaiting = true;
            this.waitingObjectChanged.next(this.waitingObject);
        });

        this.socketClient.on('deletedRoom', () => {
            this.waitingObject.waitingMessage = 'Désolé, le créateur a annulé la partie.';
            this.waitingObject.isWaiting = false;
            this.waitingObjectChanged.next(this.waitingObject);
        });

        this.socketClient.on('roomClosed', (id: number) => {
            this.waitingObject.waitingMessage = 'Désolé, le créateur a annulé la partie.';
            this.waitingObject.isWaiting = false;
            this.socketClient.send('leaveRoom', id.toString());
            this.waitingObjectChanged.next(this.waitingObject);
        });

        this.socketClient.on('rejected', (id: number) => {
            this.waitingObject.waitingMessage = 'Désolé, le créateur vous a rejeté.';
            this.socketClient.send('leaveRoom', id.toString());
            this.waitingObject.isWaiting = false;
            this.waitingObjectChanged.next(this.waitingObject);
        });

        this.socketClient.on('accepted', (url: string) => {
            this.router.navigate([url], { skipLocationChange: true });
            this.waitingObjectChanged.next(this.waitingObject);
        });

        this.socketClient.on('emptyLine', () => {
            this.waitingObject.newOpponent = false;
            this.waitingObjectChanged.next(this.waitingObject);
        });

        this.socketClient.on('nextOpponent', (userName: UserWaiting) => {
            this.waitingObject.newOpponent = true;
            this.waitingObject.opponentName = userName.userName;
            this.waitingObjectChanged.next(this.waitingObject);
        });

        this.socketClient.on('deletedFromServer', () => {
            window.alert('Ce game vient d`être supprime');
            const currentPageURL = this.router.url;
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(async () => this.router.navigate([currentPageURL]));
        });
    }

    reset() {
        this.waitingObject = {
            gameId: 0,
            playerName: '',
            opponentName: '',
            creatorName: '',
            isCreator: true,
            newOpponent: false,
            isWaiting: false,
            waitingMessage: '',
        };
    }
}
