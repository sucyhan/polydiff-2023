import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GAME_PLAYER_MODE, GAME_TIMER_MODE } from '@common/constants';
import { PlayerData } from '@common/interfaces';
import { StateGameService } from './state.game.service';

describe('StateGameService', () => {
    let service: StateGameService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule],
        });
        service = TestBed.inject(StateGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('currentPlayer should return the player with the same username as currentPlayerUsername', () => {
        service.players = [
            {
                username: 'test1',
            } as PlayerData,
        ];
        service.currentPlayerUsername = 'test1';
        expect(service.currentPlayer).toEqual(service.players[0]);
    });

    it('isSinglePlayer should return true if playerMode is singlePlayer', () => {
        service.playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        expect(service.isSinglePlayer()).toBeTrue();
    });

    it('isSinglePlayer should return false if playerMode is not singlePlayer', () => {
        service.playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        expect(service.isSinglePlayer()).toBeFalse();
    });

    it('isMultiPlayer should return true if playerMode is multiPlayer', () => {
        service.playerMode = GAME_PLAYER_MODE.MULTI_PLAYER;
        expect(service.isMultiPlayer()).toBeTrue();
    });

    it('isMultiPlayer should return false if playerMode is not multiPlayer', () => {
        service.playerMode = GAME_PLAYER_MODE.SINGLE_PLAYER;
        expect(service.isMultiPlayer()).toBeFalse();
    });

    it('isClassic should return true if timerMode is classic', () => {
        service.timerMode = GAME_TIMER_MODE.CLASSIC;
        expect(service.isClassic()).toBeTrue();
    });

    it('isClassic should return false if timerMode is not classic', () => {
        service.timerMode = GAME_TIMER_MODE.TIMED;
        expect(service.isClassic()).toBeFalse();
    });

    it('isTimed should return true if timerMode is timed', () => {
        service.timerMode = GAME_TIMER_MODE.TIMED;
        expect(service.isTimed()).toBeTrue();
    });

    it('isTimed should return false if timerMode is not timed', () => {
        service.timerMode = GAME_TIMER_MODE.CLASSIC;
        expect(service.isTimed()).toBeFalse();
    });
});
