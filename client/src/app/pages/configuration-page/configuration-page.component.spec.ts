import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { NavigationService } from '@app/services/navigation.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { FILE_TYPE, GAME_PLAYER_MODE, NUMBER_CARDS_PER_PAGE } from '@common/constants';
import { CallbackSignature, GameCardType, GameData, HistoryData, PrivateFunction } from '@common/interfaces';
import { Subject, of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ConfigurationPageComponent } from './configuration-page.component';

@Component({
    selector: 'app-general-header',
    template: '',
})
class MockGeneralHeaderComponent {
    @Input() pageTitle: string;
    @Input() icon: string;
}
@Component({
    selector: 'app-game-card',
    template: '',
})
class MockGameCardComponent {
    @ViewChild('Card') gameCard: ElementRef<HTMLDivElement>;
    @ViewChild('Button') button: ElementRef<HTMLButtonElement>;
    @ViewChild('Button1') button1Elem: ElementRef<HTMLButtonElement>;

    @Input() button1: string = 'Jouer';
    @Input() button2: string = 'Créer';
    @Input() difficulty: string = 'Facile';
    @Input() gameName: string = 'Nom du jeu';
    @Input() imgSrc: string = '/assets/pixel.bmp';
    @Input() id: number;
    @Input() isSelection: boolean;
    @Input() isAvailableToCreate: boolean = true;

    @Output() multiplayerOpen = new EventEmitter<string>();
    @Input() index: number;
    @Output() deleteEvent = new EventEmitter<string>();
}
@Component({
    selector: 'app-constants',
    template: '',
})
class MockConstantsComponent {
    @Input() time: number;
    @ViewChild('Modify') modify: ElementRef<HTMLButtonElement>;
    @ViewChild('Error') error: ElementRef<HTMLSpanElement>;
}
@Component({
    selector: 'app-history-popup',
    template: '',
})
class MockHistoryPopupComponent {
    @Input() historyData: HistoryData[];
    @Input() usedData: HistoryData[];
    @Input() showPopup: boolean = false;
    @Output() showPopupChange = new EventEmitter<boolean>();
    @ViewChild('Search') searchInput = ElementRef<HTMLInputElement>;
}
class MockStorageService {
    mockGameType: GameData = {
        id: 0,
        title: 'test',
        difficulty: 'Facile',
        numberOfDifferences: 0,
        imageSrc: 'source',
        differences: [],
    };
    readFile(id: number, fileType: FILE_TYPE) {
        if (fileType === FILE_TYPE.imageJSON) {
            const mockResponse = JSON.stringify(this.mockGameType);
            return of(mockResponse);
        }
        return;
    }
    getAllValidIds() {
        return of({ validIds: [0] });
    }
    deleteAllFiles() {
        return of('deleted');
    }
}
class MockNavigationService {
    currentIndex: number = 0;
    gameCards: GameCardType[] = [];
    gameCardsChanged: Subject<GameCardType[]> = new Subject<GameCardType[]>();
    mockGameType: GameData = {
        id: 0,
        title: 'test',
        difficulty: 'Facile',
        numberOfDifferences: 0,
        imageSrc: 'source',
        differences: [],
    };
    changeCurrentIndex(n: number) {
        this.currentIndex += n;
    }
    getImages(ids: number[]) {
        this.gameCards = [];
        const nbGameCards = 4;
        for (let i = this.currentIndex; i < ids.length && i < this.currentIndex + nbGameCards; i++) {
            this.mockGameType.id = i;
            this.gameCards.push({ game: this.mockGameType, isAvailable: true });
        }
        this.gameCardsChanged.next(this.gameCards);
    }
}
class MockSocketClientService extends SocketClientService {
    override connect(): void {
        return;
    }
}

describe('ConfigurationPageComponent', () => {
    let component: ConfigurationPageComponent;
    let fixture: ComponentFixture<ConfigurationPageComponent>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;
    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [
                ConfigurationPageComponent,
                MockGeneralHeaderComponent,
                MockGameCardComponent,
                MockConstantsComponent,
                MockHistoryPopupComponent,
            ],
            providers: [
                { provide: StorageService, useClass: MockStorageService },
                { provide: NavigationService, useClass: MockNavigationService },
                { provide: SocketClientService, useValue: socketClientServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ConfigurationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('loadGameCards should subscribe to storageService.getAllValidIds', () => {
        const getAllValidIdsSpy = spyOn(component['storageService'], 'getAllValidIds').and.callThrough();
        component['loadGameCards']();
        expect(getAllValidIdsSpy).toHaveBeenCalled();
    });

    it('loadGameCards should empty allValidIds and currentImages if no valid ids', () => {
        component['storageService'].getAllValidIds = () => of({ validIds: [] });
        component['loadGameCards']();
        expect(component['allValidIds']).toEqual([]);
        expect(component.currentImages).toEqual([]);
    });

    it('loadGameCards should disable both buttons if no valid ids', () => {
        spyOn<PrivateFunction>(component, 'disableButton');
        component['storageService'].getAllValidIds = () => of({ validIds: [] });
        component['loadGameCards']();
        expect(component['disableButton']).toHaveBeenCalledTimes(2);
    });

    it('loadGameCards should set allValidIds if valid ids', () => {
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component['loadGameCards']();
        expect(component['allValidIds']).toEqual([0, 1, 2]);
    });

    it('loadGameCards should call getImages if valid ids', () => {
        const getImagesSpy = spyOn(component['navigationService'], 'getImages').and.callThrough();
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component['loadGameCards']();
        expect(getImagesSpy).toHaveBeenCalled();
    });

    it('loadGameCards should decrease index if currentIndex is too big', () => {
        const ten = 10;
        component['navigationService'].currentIndex = ten;
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component['loadGameCards']();
        expect(component['navigationService'].currentIndex).toEqual(ten - NUMBER_CARDS_PER_PAGE);
    });

    it('ngOnInit should call loadGameCards on cardDeleted', () => {
        const loadGameCardsSpy = spyOn<PrivateFunction>(component, 'loadGameCards');
        component.ngOnInit();
        socketHelper.peerSideEmit('cardDeleted');
        expect(loadGameCardsSpy).toHaveBeenCalled();
    });

    it('ngOnInit should set historyData on updateHistory', () => {
        const testData: HistoryData[] = [
            {
                date: '',
                duration: 0,
                mode: GAME_PLAYER_MODE.SINGLE_PLAYER,
                player1: { name: '', isWinner: false, isQuitter: false },
                player2: { name: '', isWinner: false, isQuitter: false },
            },
        ];
        component.ngOnInit();
        socketHelper.peerSideEmit('updateHistory', testData);
        expect(component.historyData.length).toEqual(1);
        expect(component.historyData[0].date).toEqual(testData[0].date);
        expect(component.historyData[0].duration).toEqual(testData[0].duration);
        expect(component.historyData[0].mode).toEqual(testData[0].mode);
    });

    it('ngOnInit should call loadGameCards', () => {
        const loadGameCardsSpy = spyOn<PrivateFunction>(component, 'loadGameCards');
        component.ngOnInit();
        expect(loadGameCardsSpy).toHaveBeenCalled();
    });

    it('ngOnInit should subscribe to navigationService.gameCardsChanged', () => {
        const gameCardsChangedSpy = spyOn(component['navigationService'].gameCardsChanged, 'subscribe').and.callThrough();
        component.ngOnInit();
        expect(gameCardsChangedSpy).toHaveBeenCalled();
    });

    it('should update currentImages on gameCardsChanged', () => {
        const gameData: GameData = {
            id: 0,
            title: 'test',
            difficulty: 'Facile',
            numberOfDifferences: 0,
            imageSrc: 'source',
            differences: [],
        };
        component.currentImages = [];
        component['navigationService'].gameCardsChanged.next([{ game: gameData, isAvailable: true }]);
        expect(component.currentImages).toEqual([{ game: gameData, isAvailable: true }]);
    });

    it('ngAfterViewInit should call disableButton and set the current index to 0', () => {
        const disableButtonSpy = spyOn<PrivateFunction>(component, 'disableButton');
        component.ngAfterViewInit();
        expect(disableButtonSpy).toHaveBeenCalled();
        expect(component['navigationService'].currentIndex).toEqual(0);
    });

    it('ngOnDestroy should unsubscribe to navigationService.gameCardsChanged', () => {
        const currentImagesSubscriptionSpy = spyOn(component['currentImagesSubscription'], 'unsubscribe').and.callThrough();
        component.ngOnDestroy();
        expect(currentImagesSubscriptionSpy).toHaveBeenCalled();
    });

    it('disableButton should disable button', () => {
        component.nextButton.nativeElement.disabled = false;
        component['disableButton'](component.nextButton);
        expect(component.nextButton.nativeElement.disabled).toBeTrue();
    });
    it('activateButton should activate button', () => {
        component.nextButton.nativeElement.disabled = true;
        component['activateButton'](component.nextButton);
        expect(component.nextButton.nativeElement.disabled).toBeFalse();
    });

    it('changeNextPage should call navigationService.changeCurrentIndex', () => {
        const changeCurrentIndexSpy = spyOn(component['navigationService'], 'changeCurrentIndex');
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        component.currentImages = [];
        component.changeNextPage();
        expect(changeCurrentIndexSpy).toHaveBeenCalledWith(NUMBER_CARDS_PER_PAGE);
    });

    it('changeNextPage should call getImages', () => {
        const getImagesSpy = spyOn(component['navigationService'], 'getImages');
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changeNextPage();
        expect(getImagesSpy).toHaveBeenCalled();
    });

    it('changeNextPage should call activateButton', () => {
        const activateButtonSpy = spyOn<PrivateFunction>(component, 'activateButton');
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changeNextPage();
        expect(activateButtonSpy).toHaveBeenCalledWith(component.previousButton);
    });

    it('changeNextPage should call disableButton if currentIndex is too big', () => {
        const disableButtonSpy = spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component['navigationService'].currentIndex = 10;
        component['allValidIds'] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        component.currentImages = [];
        component.changeNextPage();
        expect(disableButtonSpy).toHaveBeenCalledWith(component.nextButton);
    });

    it('changeNextPage should set the array of currentImages sources', () => {
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        const gameCard = {
            imgSrc: '',
        } as unknown as GameCardComponent;
        component['array'] = [gameCard];
        component.currentImages = [{ game: { imageSrc: 'test' } as GameData, isAvailable: true }];
        component.changeNextPage();
        expect(component['array'][0].imgSrc).toEqual('test');
    });

    it('changePreviousPage should call navigationService.changeCurrentIndex', () => {
        const changeCurrentIndexSpy = spyOn(component['navigationService'], 'changeCurrentIndex');
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        component.currentImages = [];
        component.changePreviousPage();
        expect(changeCurrentIndexSpy).toHaveBeenCalledWith(-NUMBER_CARDS_PER_PAGE);
    });

    it('changePreviousPage should call getImages', () => {
        const getImagesSpy = spyOn(component['navigationService'], 'getImages');
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changePreviousPage();
        expect(getImagesSpy).toHaveBeenCalled();
    });

    it('changePreviousPage should call activateButton', () => {
        const activateButtonSpy = spyOn<PrivateFunction>(component, 'activateButton');
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changePreviousPage();
        expect(activateButtonSpy).toHaveBeenCalledWith(component.nextButton);
    });

    it('changePreviousPage should call disableButton if currentIndex is too small', () => {
        const disableButtonSpy = spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component['navigationService'].currentIndex = 0;
        component['allValidIds'] = [0];
        component.currentImages = [];
        component.changePreviousPage();
        expect(disableButtonSpy).toHaveBeenCalledWith(component.previousButton);
    });

    it('changePreviousPage should set the array of currentImages sources', () => {
        spyOn<PrivateFunction>(component, 'disableButton');
        spyOn<PrivateFunction>(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        const gameCard = {
            imgSrc: '',
        } as unknown as GameCardComponent;
        component['array'] = [gameCard];
        component.currentImages = [{ game: { imageSrc: 'test' } as GameData, isAvailable: true }];
        component.changePreviousPage();
        expect(component['array'][0].imgSrc).toEqual('test');
    });

    it('getImageFromGameType should return the imageSrc of the game', () => {
        const game = { imageSrc: 'test' } as GameData;
        expect(component.getImageFromGameType(game)).toEqual('test');
    });

    it('deleteCard should subscribe to storageService.getAllValidIds', () => {
        const getAllValidIdsSpy = spyOn(component['storageService'], 'getAllValidIds').and.callThrough();
        component.deleteCard();
        expect(getAllValidIdsSpy).toHaveBeenCalled();
    });

    it('deleteCard should empty allValidIds and currentImages if no valid ids', () => {
        component['storageService'].getAllValidIds = () => of({ validIds: [] });
        component.deleteCard();
        expect(component['allValidIds']).toEqual([]);
        expect(component.currentImages).toEqual([]);
    });

    it('deleteCard should set allValidIds if valid ids', () => {
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component.deleteCard();
        expect(component['allValidIds']).toEqual([0, 1, 2]);
    });

    it('deleteCard should call getImages if valid ids', () => {
        const getImagesSpy = spyOn(component['navigationService'], 'getImages').and.callThrough();
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component.deleteCard();
        expect(getImagesSpy).toHaveBeenCalled();
    });

    it('openHistory should set showHistoryPopup to true', () => {
        const sendSpy = spyOn(component.socket, 'send').and.returnValue();
        component.openHistory();
        expect(component.showHistoryPopup).toBeTrue();
        expect(sendSpy).toHaveBeenCalledWith('getHistory');
    });

    it('deleteHistory should send delete history', () => {
        const sendSpy = spyOn(component.socket, 'send').and.returnValue();
        component.deleteHistory();
        expect(sendSpy).toHaveBeenCalledWith('deleteHistory');
    });

    it('deleteAllGames should call deleteAllFiles and send deletedEverythingFromServer', () => {
        const sendSpy = spyOn(component.socket, 'send').and.returnValue();
        component.deleteAllGames();
        expect(sendSpy).toHaveBeenCalledWith('deletedEverythingFromServer');
    });

    it('resetAllGames should send resetAllGames', () => {
        const sendSpy = spyOn(component.socket, 'send').and.returnValue();
        component.resetAllGames();
        expect(sendSpy).toHaveBeenCalledWith('resetAllGames');
    });

    it('should call loadGameCards on resetAllGames message from socket', () => {
        const loadGameCardsSpy = spyOn<PrivateFunction>(component, 'loadGameCards');
        component['socket'].on = (message: string, callback: CallbackSignature) => {
            if (message === 'resetAllGames') {
                callback(0);
            }
        };
        component.ngOnInit();
        expect(loadGameCardsSpy).toHaveBeenCalled();
    });
});
