import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { WaitingPopupComponent } from '@app/components/waiting-popup/waiting-popup.component';
import { ClientSocketHandlerService } from '@app/services/client-socket-handler.service';
import { NavigationService } from '@app/services/navigation.service';
import { StorageService } from '@app/services/storage.service';
import { GameCardType, GameData } from '@common/interfaces';
import { ValidIdsMessage } from '@common/messages';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-selection-page',
    templateUrl: './game-selection-page.component.html',
    styleUrls: ['./game-selection-page.component.scss'],
})
export class GameSelectionPageComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChildren('Game') gameCards: QueryList<GameCardComponent> = new QueryList<GameCardComponent>();
    @ViewChild('Back') previousButton: ElementRef<HTMLButtonElement>;
    @ViewChild('Next') nextButton: ElementRef<HTMLButtonElement>;
    @ViewChild('User') waitingPopUp: ElementRef<WaitingPopupComponent>;
    readonly title: string = 'Sélection de partie';
    readonly icon: string = 'home';
    currentImages: GameCardType[] = [];
    currentImagesSubscription: Subscription;
    array: GameCardComponent[] = [];
    allValidIds: number[] = [];

    multiplayerButton: string = '';

    showUserName: boolean = false;
    showWaitingRoom: boolean = false;
    showJoinRoom: boolean = false;
    currentGame: { name: string; id: number } = { name: '', id: 0 };
    currentUserName: string = '';
    isCreator: boolean = true;
    newOpponent: boolean = false;

    constructor(
        private readonly storageService: StorageService,
        private readonly navigationService: NavigationService,
        private socketHandler: ClientSocketHandlerService,
    ) {}

    loadGameCards() {
        this.array = [];
        this.storageService.getAllValidIds().subscribe((message: ValidIdsMessage) => {
            if (message.validIds.length === 0) {
                this.allValidIds = [];
                this.currentImages = [];
                this.disableButton(this.nextButton);
                this.disableButton(this.previousButton);
                return;
            }
            this.activateButton(this.nextButton);

            this.allValidIds = message.validIds;
            if (this.allValidIds.length - this.navigationService.currentIndex <= 0) {
                this.navigationService.currentIndex -= 4;
            }
            this.navigationService.getImages(message.validIds);
            const numGameCards = 4;
            if (this.allValidIds.length - this.navigationService.currentIndex <= numGameCards) this.disableButton(this.nextButton);
        });
    }

    ngOnInit() {
        this.socketHandler.handleSocket();
        this.socketHandler.socketClient.on('cardDeleted', () => {
            this.loadGameCards();
        });
        this.socketHandler.socketClient.on('resetAllGames', () => {
            this.loadGameCards();
        });
        this.socketHandler.socketClient.on('numberGamesChanged', () => {
            this.loadGameCards();
        });

        this.multiplayerButton = 'Créer';
        this.currentImagesSubscription = this.navigationService.gameCardsChanged.subscribe((gameCards: GameCardType[]) => {
            this.currentImages = gameCards;
            this.array = this.gameCards.toArray();
        });
        this.loadGameCards();
    }

    ngAfterViewInit(): void {
        this.disableButton(this.previousButton);
        this.navigationService.currentIndex = 0;
        this.socketHandler.reset();
    }

    ngOnDestroy(): void {
        this.socketHandler.socketClient.disconnect();
        this.currentImagesSubscription.unsubscribe();
    }

    disableButton(button: ElementRef<HTMLButtonElement>) {
        button.nativeElement.disabled = true;
    }

    activateButton(button: ElementRef<HTMLButtonElement>) {
        button.nativeElement.disabled = false;
    }

    changeNextPage() {
        const numGameCards = 4;
        this.navigationService.changeCurrentIndex(numGameCards);
        this.navigationService.getImages(this.allValidIds);
        this.activateButton(this.previousButton);
        if (this.navigationService.currentIndex + numGameCards >= this.allValidIds.length) {
            this.disableButton(this.nextButton);
        }

        for (let i = 0; i < this.array.length; i++) {
            this.array[i].imgSrc = this.currentImages[i].game.imageSrc as string;
        }
    }

    changePreviousPage() {
        const numGameCards = 4;
        this.navigationService.changeCurrentIndex(-numGameCards);
        this.navigationService.getImages(this.allValidIds);
        this.activateButton(this.nextButton);
        if (this.navigationService.currentIndex <= 0) {
            this.disableButton(this.previousButton);
        }

        for (let i = 0; i < this.currentImages.length; i++) {
            this.array[i].imgSrc = this.currentImages[i].game.imageSrc as string;
        }
    }

    getImageFromGameType(gameData: GameData): string {
        return gameData.imageSrc as string;
    }

    openMultiplayer(name: string, id: number, isCreator: boolean) {
        this.socketHandler.waitingObject.gameId = id;
        this.showUserName = true;
        this.currentGame.name = name;
        this.currentGame.id = id;
        this.isCreator = isCreator;
        this.socketHandler.waitingObject.isCreator = isCreator;
        if (this.isCreator) {
            this.socketHandler.waitingObject.isWaiting = true;
            this.socketHandler.socketClient.send('createWaitingRoom', [this.currentGame.id + 1, this.currentGame.name]);
        }
    }

    selectRoomOption(isCreator: boolean) {
        if (isCreator) {
            this.showWaitingRoom = true;
            this.socketHandler.waitingObject.creatorName = this.currentUserName;
        } else {
            this.showJoinRoom = true;
            this.socketHandler.waitingObject.opponentName = this.currentUserName;
            this.socketHandler.socketClient.send('joinWaitingRoom', [
                this.currentGame.id + 1,
                { socketId: this.socketHandler.socketClient.socket.id, userName: this.currentUserName },
            ]);
        }
    }

    openWaitingRoom(event: string) {
        this.showUserName = false;
        this.currentUserName = event;
        this.selectRoomOption(this.isCreator);
        this.newOpponent = false;
    }
}
