import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ClientSocketHandlerService } from '@app/services/client-socket-handler.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GAME_TIMER_MODE } from '@common/constants';
import { ClientWaitingObject } from '@common/interfaces';

@Component({
    selector: 'app-waiting-popup',
    templateUrl: './waiting-popup.component.html',
    styleUrls: ['./waiting-popup.component.scss'],
})
export class WaitingPopupComponent implements OnChanges, AfterViewInit {
    @Input() showPopup: boolean = false;
    @Output() showPopupChange = new EventEmitter<boolean>();

    @Input() isCreator: boolean = true;
    @Input() currentPlayer: string = '';
    @Input() gameName: string = '';
    @Input() gameId: number = 0;
    @Input() newOpponent: boolean = false;
    @Output() newOpponentOffer = new EventEmitter<string>();
    opponentName: string = '';

    waitingMessage: string = '';
    waitingObject: ClientWaitingObject = {
        gameId: 0,
        playerName: '',
        opponentName: '',
        creatorName: '',
        isCreator: false,
        newOpponent: false,
        isWaiting: false,
        waitingMessage: 'string',
    };

    constructor(private socketHandler: ClientSocketHandlerService, private readonly socketClient: SocketClientService) {}

    ngOnChanges() {
        this.setMessages();
    }

    ngAfterViewInit(): void {
        this.socketHandler.waitingObjectChanged.subscribe((value) => {
            this.waitingObject = value;
            this.isCreator = value.isCreator;
            this.newOpponent = value.newOpponent;
            this.opponentName = value.opponentName;
            this.currentPlayer = value.creatorName;
        });
    }

    reject() {
        this.newOpponent = false;
        this.newOpponentOffer.emit('rejected');
        this.socketClient.send('rejected', this.gameId + 1);
    }

    accept() {
        this.showPopup = false;
        this.newOpponentOffer.emit('accepted');
        this.socketClient.send('accepted', [GAME_TIMER_MODE.CLASSIC, this.gameId + 1, this.currentPlayer]);
    }

    close() {
        if (this.showPopup) {
            this.socketClient.send('deleteWaitingRoom', this.gameId + 1);
        }
        this.socketHandler.waitingObject.isWaiting = false;
        this.showPopup = false;
        this.showPopupChange.emit(this.showPopup);
    }

    private setMessages() {
        this.waitingMessage = "En attente d'un adversaire";
    }
}
