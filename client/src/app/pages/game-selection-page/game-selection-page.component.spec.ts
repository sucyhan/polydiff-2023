import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { ClientSocketHandlerService } from '@app/services/client-socket-handler.service';
import { NavigationService } from '@app/services/navigation.service';
import { StorageService } from '@app/services/storage.service';
import { FILE_TYPE, NUMBER_CARDS_PER_PAGE } from '@common/constants';
import { CallbackSignature, ClientWaitingObject, GameCardType, GameData } from '@common/interfaces';
import { Subject, of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GameSelectionPageComponent } from './game-selection-page.component';

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
    selector: 'app-waiting-popup',
    template: '',
})
class MockWaitingPopupComponent {
    @Input() showPopup: boolean = false;
    @Output() showPopupChange = new EventEmitter<boolean>();

    @Input() isCreator: boolean = true;
    @Input() currentPlayer: string;
    @Input() gameName: string;
    @Input() gameId: number = 0;
    @Input() newOpponent: boolean;
    @Output() newOpponentOffer = new EventEmitter<string>();
    opponentName: string;

    waitingMessage: string = '';
    waitingObject: ClientWaitingObject;
}
@Component({
    selector: 'app-join-game-popup',
    template: '',
})
class MockJoinGamePopupComponent {
    @Input() showPopup: boolean = false;
    @Output() showPopupChange = new EventEmitter<boolean>();

    @Input() currentPlayer: string;
    @Input() gameName: string;
    @Input() gameId: number = 0;
}
@Component({
    selector: 'app-user-name-input',
    template: '',
})
class MockUserNameInputComponent {
    @ViewChild('usernameInput') usernameInput: ElementRef;
    @Output() userNameReset = new EventEmitter<string>();

    @Input() showPopup: boolean;
    @Output() showPopupChange = new EventEmitter<boolean>();
    @Input() gameName: string = '';
    @Input() gameId: number = 0;
    @Output() openWaitingRoom = new EventEmitter<string>();
    showErrorMessage: boolean = false;
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

class MockClientSocketHandlerService {
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
    socketClient: SocketTestHelper = new SocketTestHelper();
    handleSocket() {
        return;
    }
    reset() {
        return;
    }
}

describe('GameSelectionPageComponent', () => {
    let component: GameSelectionPageComponent;
    let fixture: ComponentFixture<GameSelectionPageComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                GameSelectionPageComponent,
                MockGeneralHeaderComponent,
                MockGameCardComponent,
                MockWaitingPopupComponent,
                MockJoinGamePopupComponent,
                MockUserNameInputComponent,
            ],
            providers: [
                { provide: StorageService, useClass: MockStorageService },
                { provide: NavigationService, useClass: MockNavigationService },
                { provide: ClientSocketHandlerService, useClass: MockClientSocketHandlerService },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(GameSelectionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('loadGameCards should subscribe to storageService.getAllValidIds', () => {
        const getAllValidIdsSpy = spyOn(component['storageService'], 'getAllValidIds').and.callThrough();
        component.loadGameCards();
        expect(getAllValidIdsSpy).toHaveBeenCalled();
    });

    it('loadGameCards should empty allValidIds and currentImages if no valid ids', () => {
        component['storageService'].getAllValidIds = () => of({ validIds: [] });
        component.loadGameCards();
        expect(component.allValidIds).toEqual([]);
        expect(component.currentImages).toEqual([]);
    });

    it('loadGameCards should disable both buttons if no valid ids', () => {
        spyOn(component, 'disableButton');
        component['storageService'].getAllValidIds = () => of({ validIds: [] });
        component.loadGameCards();
        expect(component.disableButton).toHaveBeenCalledTimes(2);
    });

    it('loadGameCards should set allValidIds if valid ids', () => {
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component.loadGameCards();
        expect(component.allValidIds).toEqual([0, 1, 2]);
    });

    it('loadGameCards should call getImages if valid ids', () => {
        const getImagesSpy = spyOn(component['navigationService'], 'getImages').and.callThrough();
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component.loadGameCards();
        expect(getImagesSpy).toHaveBeenCalled();
    });

    it('loadGameCards should decrease index if currentIndex is too big', () => {
        const ten = 10;
        component['navigationService'].currentIndex = ten;
        component['storageService'].getAllValidIds = () => of({ validIds: [0, 1, 2] });
        component.loadGameCards();
        expect(component['navigationService'].currentIndex).toEqual(ten - NUMBER_CARDS_PER_PAGE);
    });

    it('ngOnInit should call loadGameCards', () => {
        const loadGameCardsSpy = spyOn(component, 'loadGameCards');
        component.ngOnInit();
        expect(loadGameCardsSpy).toHaveBeenCalled();
    });

    it('ngOnInit should subscribe to navigationService.gameCardsChanged', () => {
        const gameCardsChangedSpy = spyOn(component['navigationService'].gameCardsChanged, 'subscribe').and.callThrough();
        component.ngOnInit();
        expect(gameCardsChangedSpy).toHaveBeenCalled();
    });

    it('should call loadGameCards on cardDeleted message from socket', () => {
        const loadGameCardsSpy = spyOn(component, 'loadGameCards');
        component['socketHandler'].socketClient.on = (message: string, callback: CallbackSignature) => {
            if (message === 'cardDeleted') {
                callback(0);
            }
        };
        component.ngOnInit();
        expect(loadGameCardsSpy).toHaveBeenCalled();
    });

    it('should call loadGameCards on resetAllGames message from socket', () => {
        const loadGameCardsSpy = spyOn(component, 'loadGameCards');
        component['socketHandler'].socketClient.on = (message: string, callback: CallbackSignature) => {
            if (message === 'resetAllGames') {
                callback(0);
            }
        };
        component.ngOnInit();
        expect(loadGameCardsSpy).toHaveBeenCalled();
    });

    it('should call loadGameCards on numberGamesChanged message from socket', () => {
        const loadGameCardsSpy = spyOn(component, 'loadGameCards');
        component['socketHandler'].socketClient.on = (message: string, callback: CallbackSignature) => {
            if (message === 'numberGamesChanged') {
                callback(0);
            }
        };
        component.ngOnInit();
        expect(loadGameCardsSpy).toHaveBeenCalled();
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
        const disableButtonSpy = spyOn(component, 'disableButton');
        component.ngAfterViewInit();
        expect(disableButtonSpy).toHaveBeenCalled();
        expect(component['navigationService'].currentIndex).toEqual(0);
    });

    it('ngOnDestroy should unsubscribe to navigationService.gameCardsChanged', () => {
        const currentImagesSubscriptionSpy = spyOn(component.currentImagesSubscription, 'unsubscribe').and.callThrough();
        component.ngOnDestroy();
        expect(currentImagesSubscriptionSpy).toHaveBeenCalled();
    });

    it('ngOnDestroy should disconnect socketClient', () => {
        const disconnectSpy = spyOn(component['socketHandler'].socketClient, 'disconnect').and.callThrough();
        component.ngOnDestroy();
        expect(disconnectSpy).toHaveBeenCalled();
    });

    it('disableButton should disable button', () => {
        component.nextButton.nativeElement.disabled = false;
        component.disableButton(component.nextButton);
        expect(component.nextButton.nativeElement.disabled).toBeTrue();
    });
    it('activateButton should activate button', () => {
        component.nextButton.nativeElement.disabled = true;
        component.activateButton(component.nextButton);
        expect(component.nextButton.nativeElement.disabled).toBeFalse();
    });

    it('changeNextPage should call navigationService.changeCurrentIndex', () => {
        const changeCurrentIndexSpy = spyOn(component['navigationService'], 'changeCurrentIndex');
        spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        component.currentImages = [];
        component.changeNextPage();
        expect(changeCurrentIndexSpy).toHaveBeenCalledWith(NUMBER_CARDS_PER_PAGE);
    });

    it('changeNextPage should call getImages', () => {
        const getImagesSpy = spyOn(component['navigationService'], 'getImages');
        spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changeNextPage();
        expect(getImagesSpy).toHaveBeenCalled();
    });

    it('changeNextPage should call activateButton', () => {
        const activateButtonSpy = spyOn(component, 'activateButton');
        spyOn(component, 'disableButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changeNextPage();
        expect(activateButtonSpy).toHaveBeenCalledWith(component.previousButton);
    });

    it('changeNextPage should call disableButton if currentIndex is too big', () => {
        const disableButtonSpy = spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component['navigationService'].currentIndex = 10;
        component.allValidIds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        component.currentImages = [];
        component.changeNextPage();
        expect(disableButtonSpy).toHaveBeenCalledWith(component.nextButton);
    });

    it('changeNextPage should set the array of currentImages sources', () => {
        spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        const gameCard = {
            imgSrc: '',
        } as unknown as GameCardComponent;
        component.array = [gameCard];
        component.currentImages = [{ game: { imageSrc: 'test' } as GameData, isAvailable: true }];
        component.changeNextPage();
        expect(component.array[0].imgSrc).toEqual('test');
    });

    it('changePreviousPage should call navigationService.changeCurrentIndex', () => {
        const changeCurrentIndexSpy = spyOn(component['navigationService'], 'changeCurrentIndex');
        spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        component.currentImages = [];
        component.changePreviousPage();
        expect(changeCurrentIndexSpy).toHaveBeenCalledWith(-NUMBER_CARDS_PER_PAGE);
    });

    it('changePreviousPage should call getImages', () => {
        const getImagesSpy = spyOn(component['navigationService'], 'getImages');
        spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changePreviousPage();
        expect(getImagesSpy).toHaveBeenCalled();
    });

    it('changePreviousPage should call activateButton', () => {
        const activateButtonSpy = spyOn(component, 'activateButton');
        spyOn(component, 'disableButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component.currentImages = [];
        component.changePreviousPage();
        expect(activateButtonSpy).toHaveBeenCalledWith(component.nextButton);
    });

    it('changePreviousPage should call disableButton if currentIndex is too small', () => {
        const disableButtonSpy = spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        component['navigationService'].currentIndex = 0;
        component.allValidIds = [0];
        component.currentImages = [];
        component.changePreviousPage();
        expect(disableButtonSpy).toHaveBeenCalledWith(component.previousButton);
    });

    it('changePreviousPage should set the array of currentImages sources', () => {
        spyOn(component, 'disableButton');
        spyOn(component, 'activateButton');
        spyOn(component['navigationService'], 'getImages');
        spyOn(component['navigationService'], 'changeCurrentIndex');
        const gameCard = {
            imgSrc: '',
        } as unknown as GameCardComponent;
        component.array = [gameCard];
        component.currentImages = [{ game: { imageSrc: 'test' } as GameData, isAvailable: true }];
        component.changePreviousPage();
        expect(component.array[0].imgSrc).toEqual('test');
    });

    it('getImageFromGameType should return the imageSrc of the game', () => {
        const game = { imageSrc: 'test' } as GameData;
        expect(component.getImageFromGameType(game)).toEqual('test');
    });

    it('openMultiplayer should set the attributes from the game', () => {
        component.showUserName = false;
        component.currentGame = { name: '', id: 0 };
        component.isCreator = false;
        component.openMultiplayer('test', 1, true);
        expect(component.showUserName).toBeTrue();
        expect(component.currentGame.name).toEqual('test');
        expect(component.currentGame.id).toEqual(1);
        expect(component.isCreator).toBeTrue();
    });

    it('openMultiplayer shoud send createWaitingRoom if isCreator is true', () => {
        const createWaitingRoomSpy = spyOn(component['socketHandler'].socketClient, 'send');
        component.showUserName = false;
        component.currentGame = { name: '', id: 0 };
        component.isCreator = true;
        component.openMultiplayer('test', 1, true);
        expect(createWaitingRoomSpy).toHaveBeenCalledWith('createWaitingRoom', [2, 'test']);
    });

    it('selectRoomOption should set showWaitingRoom to true and creator name to currentUserName if isCreator is true', () => {
        component.showWaitingRoom = false;
        component.isCreator = true;
        component.currentUserName = 'test';
        component.selectRoomOption(true);
        expect(component.showWaitingRoom).toBeTrue();
        expect(component['socketHandler'].waitingObject.creatorName).toEqual('test');
    });

    it('should set showJoinRoom to true and set the currentUsername to the opponentName if isCreator is false', () => {
        component.showJoinRoom = false;
        component.isCreator = false;
        component.currentGame = { name: '', id: 0 };
        component['socketHandler'].socketClient.socket = { id: 1 } as unknown as Socket;
        component.currentUserName = 'test';
        component.selectRoomOption(false);
        expect(component.showJoinRoom).toBeTrue();
        expect(component['socketHandler'].waitingObject.opponentName).toEqual('test');
    });

    it('openWaitingRoom should set showUserName and newOpponent to false', () => {
        component.showUserName = true;
        component.newOpponent = true;
        component.openWaitingRoom('event');
        expect(component.showUserName).toBeFalse();
        expect(component.newOpponent).toBeFalse();
    });

    it('openWaitingRoom should set the currentUserName to the provided string', () => {
        component.currentUserName = '';
        component.openWaitingRoom('test');
        expect(component.currentUserName).toEqual('test');
    });

    it('openWaitingRoom should call selectRoomOption with isCreator', () => {
        const selectRoomOptionSpy = spyOn(component, 'selectRoomOption');
        component.isCreator = true;
        component.openWaitingRoom('event');
        expect(selectRoomOptionSpy).toHaveBeenCalledWith(true);
    });
});
