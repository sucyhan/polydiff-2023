import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayerData, Point } from '@common/interfaces';
import { Subject } from 'rxjs';
import { MouseGameService } from './mouse-handler.game.service';
import { StateGameService } from './state.game.service';
import { ValidationGameService } from './validation.game.service';

class MockStateGameService {
    players: PlayerData[] = [];
    playersChanged = new Subject<PlayerData[]>();
    canMakeMove: boolean = true;
    canMakeMoveChanged = new Subject<boolean>();
}

class MockValidationGameService {
    validateMove(coordinate: Point) {
        return coordinate;
    }
}

describe('MouseHandlerService', () => {
    let service: MouseGameService;

    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
                {
                    provide: ValidationGameService,
                    useClass: MockValidationGameService,
                },
            ],
        }),
    );

    beforeEach(() => {
        service = TestBed.inject(MouseGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('constructor should initialize variables', () => {
        expect(service.startCoordinate).toEqual({ x: 0, y: 0 });
    });

    it('should update players when update is received from gameMasterService', () => {
        const expected: PlayerData[] = [
            {
                username: 'test',
                differencesFound: [],
                invalidMoves: [],
            },
        ];
        service.players = [];
        service['stateGameService'].players = expected;
        service['stateGameService'].playersChanged.next(expected);
        expect(service.players).toEqual(expected);
    });

    it('should update canMakeMove when update is received from gameMasterService', () => {
        service.canMakeMove = false;
        service['stateGameService'].canMakeMove = true;
        service['stateGameService'].canMakeMoveChanged.next(true);
        expect(service.canMakeMove).toEqual(true);
    });

    it('should unsubscribe from playersChanged when ngOnDestroy is called', () => {
        const unsubscribeSpy = spyOn(service.playersSubscription, 'unsubscribe');
        service.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from canMakeMoveChanged when ngOnDestroy is called', () => {
        const unsubscribeSpy = spyOn(service.canMakeMoveSubscription, 'unsubscribe');
        service.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('onMouseDown should not change startCoordinate if canMakeMove is false', () => {
        const expected: Point = { x: 0, y: 0 };
        service.canMakeMove = false;
        service.startCoordinate = expected;
        service.onMouseDown({ x: 1, y: 1 });
        expect(service.startCoordinate).toEqual(expected);
    });

    it('onMouseDown should change startCoordinate if canMakeMove is true', () => {
        const expected: Point = { x: 1, y: 1 };
        service.canMakeMove = true;
        service.onMouseDown(expected);
        expect(service.startCoordinate).toEqual(expected);
    });

    it('onMouseDown should call validateMove if canMakeMove is true', () => {
        const validateMoveSpy = spyOn(service['validationGameService'], 'validateMove');
        service.canMakeMove = true;
        service.onMouseDown({ x: 1, y: 1 });
        expect(validateMoveSpy).toHaveBeenCalled();
    });
});
