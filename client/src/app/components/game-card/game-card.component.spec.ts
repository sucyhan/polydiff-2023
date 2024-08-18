import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { GAME_PLAYER_MODE, PAGE_TYPE, USERS_1V1_RANKING, USERS_SOLO_RANKING } from '@common/constants';
import { GameRankings, UsersScore } from '@common/interfaces';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GameCardComponent } from './game-card.component';

class MockSocketClientService extends SocketClientService {
    // Needed for mocking socket.send while keeping the same signature
    // eslint-disable-next-line no-unused-vars
    override send<T>(event: string, data?: T) {
        return;
    }
    override connect(): void {
        return;
    }
}

class MockStorageService {
    deleteFiles(): void {
        return;
    }
}

describe('GameCardComponent', () => {
    let component: GameCardComponent;
    let fixture: ComponentFixture<GameCardComponent>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [GameCardComponent],
            imports: [RouterTestingModule],
            providers: [
                { provide: SocketClientService, useValue: socketClientServiceMock },
                { provide: StorageService, useClass: MockStorageService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        spyOn(component['router'], 'navigate').and.returnValue(Promise.resolve(true));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have play button', () => {
        expect(component.button1).toEqual('Jouer');
    });

    it('should have create button', () => {
        expect(component.button2).toEqual('Créer');
    });

    it('should have 3 ranking numbers', () => {
        const columns = fixture.debugElement.queryAll(By.css('#numbers'));
        expect(columns.length).toEqual(3);
    });

    it('should have 3 best solo users', () => {
        const users = fixture.debugElement.queryAll(By.css('#solo'));
        expect(users.length).toEqual(3);
    });

    it('should have 3 best 1v1 users', () => {
        const users = fixture.debugElement.queryAll(By.css('#onevone'));
        expect(users.length).toEqual(3);
    });

    it('ngOnChanges should do nothing if isSelection is false', () => {
        component.isSelection = false;
        component.ngOnChanges();
        expect(component.isAvailableToCreate).toBeTruthy();
    });

    it('ngOnChanges should set isAvailableToCreate to false if createdGame received', () => {
        spyOn(component, 'setUpButtons').and.returnValue();
        component.isSelection = true;
        component.id = 1;
        component.ngOnChanges();
        socketHelper.peerSideEmit('createdGame', 2);
        expect(component.isAvailableToCreate).toBeFalsy();
        expect(component.setUpButtons).toHaveBeenCalled();
    });

    it('ngOnChanges should set isAvailableToCreate to true if deletedWaitingRoom received', () => {
        spyOn(component, 'setUpButtons').and.returnValue();
        component.isSelection = true;
        component.isAvailableToCreate = false;
        component.id = 1;
        component.ngOnChanges();
        socketHelper.peerSideEmit('deletedWaitingRoom', 2);
        expect(component.isAvailableToCreate).toBeTruthy();
        expect(component.setUpButtons).toHaveBeenCalled();
    });

    it('ngOnChanges should not set isAvailableToCreate to false if deletedWaitingRoom received with invalid id', () => {
        spyOn(component, 'setUpButtons').and.returnValue();
        component.isSelection = true;
        component.isAvailableToCreate = false;
        component.id = 10;
        component.ngOnChanges();
        socketHelper.peerSideEmit('deletedWaitingRoom', 2);
        expect(component.isAvailableToCreate).toBeFalsy();
        expect(component.setUpButtons).not.toHaveBeenCalled();
    });

    it('ngOnChanges should not set isAvailableToCreate to true if creatorLeft received with invalid id', () => {
        spyOn(component, 'setUpButtons').and.returnValue();
        component.isSelection = true;
        component.isAvailableToCreate = false;
        component.id = 10;
        component.ngOnChanges();
        socketHelper.peerSideEmit('creatorLeft', 2);
        expect(component.isAvailableToCreate).toBeFalsy();
        expect(component.setUpButtons).toHaveBeenCalled();
    });

    it('ngOnChanges should set isAvailableToCreate to true if creatorLeft received', () => {
        spyOn(component, 'setUpButtons').and.returnValue();
        component.isSelection = true;
        component.isAvailableToCreate = false;
        component.id = 1;
        component.ngOnChanges();
        socketHelper.peerSideEmit('creatorLeft', 2);
        expect(component.isAvailableToCreate).toBeTrue();
        expect(component.setUpButtons).toHaveBeenCalled();
    });

    it('ngAfterViewInit should set pageType and send isCardCreating', () => {
        component.isSelection = true;
        spyOn(socketHelper, 'on').and.returnValue();
        component.ngAfterViewInit();
        expect(component.pageType).toEqual(PAGE_TYPE.Selection);
        expect(socketHelper.on).toHaveBeenCalled();
    });

    it('ngAfterViewInit should set isAvailableToCreate to false if data[0] and id equals data[1]', () => {
        component.isSelection = true;
        component.id = 0;
        socketHelper.peerSideEmit('isCardCreating', [true, 0]);
        component.ngAfterViewInit();
        expect(component.isAvailableToCreate).toBeFalsy();
    });

    it('ngAfterViewInit should set good scores', () => {
        const gameScores: GameRankings = {
            gameId: 1,
            singlePlayer: USERS_SOLO_RANKING,
            multiPlayer: USERS_1V1_RANKING,
        };
        component.id = 1;
        socketHelper.peerSideEmit('getAllScores', [1, gameScores]);
        component.ngAfterViewInit();
        expect(component.usersSolo[0].time).toEqual(gameScores.singlePlayer[0].time);
    });

    it('ngAfterViewInit should set new record if multiplayer', () => {
        const gameScores: GameRankings = {
            gameId: 1,
            singlePlayer: USERS_SOLO_RANKING,
            multiPlayer: USERS_1V1_RANKING,
        };
        component.id = 1;
        socketHelper.peerSideEmit('newRecord', [1, GAME_PLAYER_MODE.MULTI_PLAYER, gameScores]);
        component.ngAfterViewInit();
        expect(component.usersSolo[0].time).toEqual(gameScores.singlePlayer[0].time);
    });

    it('ngAfterViewInit should set new record if single', () => {
        const gameScores: UsersScore[] = USERS_SOLO_RANKING;
        component.id = 1;
        socketHelper.peerSideEmit('newRecord', [1, GAME_PLAYER_MODE.SINGLE_PLAYER, gameScores]);
        component.ngAfterViewInit();
        expect(component.usersSolo[0].time).toEqual(gameScores[0].time);
    });

    it('ngAfterViewInit should set isAvailableToCreate to true if data[0] and id is not equal to data[1]', () => {
        component.isSelection = true;
        component.id = 0;
        socketHelper.peerSideEmit('isCardCreating', [false, 2]);
        component.ngAfterViewInit();
        expect(component.isAvailableToCreate).toBeTrue();
    });

    it('setUpButtons should set button1Elem to disabled if isSelection is false', () => {
        component.isSelection = false;
        component.setUpButtons();
        expect(component.button1Elem.nativeElement.disabled).toBe(false);
    });

    it('setUpButtons should set button2 to créer if isSelection and isAvailableToCreate are true', () => {
        component.isSelection = true;
        component.isAvailableToCreate = true;
        component.setUpButtons();
        expect(component.button2).toEqual('Créer');
    });

    it('setUpButtons should set button2 to joindre if isSelection is true and isAvailableToCreate is false', () => {
        component.isSelection = true;
        component.isAvailableToCreate = false;
        component.setUpButtons();
        expect(component.button2).toEqual('Joindre');
    });

    it('should call navigate to', () => {
        component.navigateTo();
        expect(component['router'].navigate).toHaveBeenCalled();
    });

    it('should hide', () => {
        component.hide();
        expect(component.gameCard.nativeElement.style.visibility === 'hidden').toBeTruthy();
    });

    it('should show', () => {
        component.show();
        expect(component.gameCard.nativeElement.style.visibility === 'hidden').toBeFalsy();
    });

    it('leftButtonBehavior should call navigateTo if isSelection is true', () => {
        spyOn(component, 'navigateTo').and.returnValue();
        component.isSelection = true;
        component.leftButtonBehavior();
        expect(component.navigateTo).toHaveBeenCalled();
    });

    it('leftButtonBehavior should not call navigateTo if isSelection is false', () => {
        spyOn(component, 'navigateTo').and.returnValue();
        component.isSelection = false;
        component.leftButtonBehavior();
        expect(component.navigateTo).not.toHaveBeenCalled();
    });

    it('rightButtonBehavior should call delete if isSelection is false', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(component, 'delete').and.returnValue();
        component.isSelection = false;
        component.rightButtonBehavior();
        expect(component.delete).toHaveBeenCalled();
    });

    it('rightButtonBehavior should not call delete if isSelection is true', () => {
        spyOn(component, 'delete').and.returnValue();
        const emitSpy = spyOn(EventEmitter.prototype, 'emit').and.returnValue();
        component.isSelection = true;
        component.rightButtonBehavior();
        expect(component.delete).not.toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('delete should call storageService.deleteFiles', () => {
        spyOn(component['storageService'], 'deleteFiles').and.returnValue(of('done'));
        spyOn(component, 'emitEventToParent').and.returnValue();
        spyOn(component['socketClient'], 'send').and.returnValue();
        component.id = 0;
        component.delete();
        expect(component['storageService'].deleteFiles).toHaveBeenCalled();
        expect(component.emitEventToParent).toHaveBeenCalled();
        expect(component['socketClient'].send).toHaveBeenCalledWith('deletedFromServer', 1);
    });

    it('emitEventToParent should emit event', () => {
        const emitSpy = spyOn(EventEmitter.prototype, 'emit').and.returnValue();
        component.emitEventToParent();
        expect(emitSpy).toHaveBeenCalledWith('Delete');
    });
});
