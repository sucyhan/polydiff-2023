import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { ClientSocketHandlerService } from '@app/services/client-socket-handler.service';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-join-game-popup',
    templateUrl: './join-game-popup.component.html',
    styleUrls: ['./join-game-popup.component.scss'],
})
export class JoinGamePopupComponent implements AfterViewInit {
    @Input() showPopup: boolean = false;
    @Output() showPopupChange = new EventEmitter<boolean>();

    @Input() currentPlayer: string = '';
    @Input() gameName: string = '';
    @Input() gameId: number = 0;

    creatorName: string = '';
    opponentName: string = '';
    isWaiting: boolean = false;
    waitingMessage: string = '';
    imgSrc: string = 'assets/waiting.png';

    constructor(private socketHandler: ClientSocketHandlerService, private readonly socketClient: SocketClientService) {}

    ngAfterViewInit(): void {
        this.socketHandler.waitingObjectChanged.subscribe((value) => {
            this.creatorName = value.opponentName;
            this.currentPlayer = value.opponentName;
            this.isWaiting = value.isWaiting;
            this.gameId = value.gameId;
            this.waitingMessage = value.waitingMessage;
        });
    }

    close() {
        this.showPopup = false;
        this.showPopupChange.emit(this.showPopup);
        if (this.isWaiting) {
            this.socketClient.send('quitLine', this.gameId + 1);
        }
    }
}
