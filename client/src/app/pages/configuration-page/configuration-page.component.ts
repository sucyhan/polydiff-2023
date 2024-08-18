import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { NavigationService } from '@app/services/navigation.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { CONFIGURATION_GAME_CONSTANTS, NUMBER_CARDS_PER_PAGE } from '@common/constants';
import { GameCardType, GameData, HistoryData } from '@common/interfaces';
import { ValidIdsMessage } from '@common/messages';
import { Subject, Subscription } from 'rxjs';

@Component({
    selector: 'app-configuration-page',
    templateUrl: './configuration-page.component.html',
    styleUrls: ['./configuration-page.component.scss'],
})
export class ConfigurationPageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChildren('Game') gameCards: QueryList<GameCardComponent> = new QueryList<GameCardComponent>();
    @ViewChild('Back') previousButton: ElementRef<HTMLButtonElement>;
    @ViewChild('Next') nextButton: ElementRef<HTMLButtonElement>;
    readonly title: string = 'Configuration';
    readonly icon: string = 'home';
    readonly buttonReset: string = 'Réinitialiser';
    readonly buttonDelete: string = 'Supprimer';
    readonly gameConstants = CONFIGURATION_GAME_CONSTANTS;
    readonly constantUnit: string = 'sec';
    readonly buttons: { name: string; link: string }[] = [
        { name: 'Créer', link: '/create' },
        { name: 'Supprimer les jeux', link: '' },
        { name: 'Voir historique', link: '' },
        { name: 'Supprimer historique', link: '' },
        { name: 'Réinitialiser les meilleurs temps', link: '' },
    ];
    deleteEvent: Subject<void> = new Subject<void>();
    showHistoryPopup: boolean;
    historyData: HistoryData[] = [];
    currentImages: GameCardType[] = [];
    private currentImagesSubscription: Subscription;
    private array: GameCardComponent[] = [];
    private allValidIds: number[] = [];
    constructor(
        private readonly storageService: StorageService,
        private readonly navigationService: NavigationService,
        readonly socket: SocketClientService,
    ) {}

    ngOnInit() {
        this.currentImagesSubscription = this.navigationService.gameCardsChanged.subscribe((gameCards: GameCardType[]) => {
            this.currentImages = gameCards;
            this.array = this.gameCards.toArray();
        });
        this.loadGameCards();
        this.socket.connect();
        this.socket.on('cardDeleted', () => {
            this.loadGameCards();
        });
        this.socket.on('resetAllGames', () => {
            this.loadGameCards();
        });
        this.socket.on('updateHistory', (data: HistoryData[]) => {
            this.historyData = data.reverse();
        });
    }

    ngAfterViewInit(): void {
        this.disableButton(this.previousButton);
        this.navigationService.currentIndex = 0;
    }

    ngOnDestroy(): void {
        this.navigationService.currentIndex = 0;
        this.currentImagesSubscription.unsubscribe();
    }

    changeNextPage() {
        this.navigationService.changeCurrentIndex(NUMBER_CARDS_PER_PAGE);
        this.navigationService.getImages(this.allValidIds);
        this.activateButton(this.previousButton);
        if (this.navigationService.currentIndex + NUMBER_CARDS_PER_PAGE >= this.allValidIds.length) {
            this.disableButton(this.nextButton);
        }

        for (let i = 0; i < this.array.length; i++) {
            this.array[i].imgSrc = this.currentImages[i].game.imageSrc as string;
        }
    }

    changePreviousPage() {
        this.navigationService.changeCurrentIndex(-NUMBER_CARDS_PER_PAGE);
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
    deleteCard() {
        this.storageService.getAllValidIds().subscribe((message: ValidIdsMessage) => {
            if (message.validIds.length === 0) {
                this.allValidIds = [];
                this.currentImages = [];
                return;
            }
            this.allValidIds = message.validIds;
            this.loadGameCards();
            if (this.allValidIds.length - this.navigationService.currentIndex <= NUMBER_CARDS_PER_PAGE) this.disableButton(this.nextButton);
        });
    }
    openHistory() {
        this.socket.send('getHistory');
        this.showHistoryPopup = true;
    }
    deleteHistory() {
        this.socket.send('deleteHistory');
    }

    deleteAllGames() {
        this.storageService.deleteAllFiles().subscribe(() => {
            this.socket.send('deletedEverythingFromServer');
        });
    }

    resetAllGames() {
        this.socket.send('resetAllGames');
    }

    private disableButton(button: ElementRef<HTMLButtonElement>) {
        button.nativeElement.disabled = true;
    }
    private activateButton(button: ElementRef<HTMLButtonElement>) {
        button.nativeElement.disabled = false;
    }

    private loadGameCards() {
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
                this.navigationService.currentIndex -= NUMBER_CARDS_PER_PAGE;
            }
            this.navigationService.getImages(message.validIds);
            if (this.allValidIds.length - this.navigationService.currentIndex <= NUMBER_CARDS_PER_PAGE) this.disableButton(this.nextButton);
        });
    }
}
