import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client.service';
import { CONFIG_CONSTANTS, TIME } from '@common/constants';
import { Socket } from 'socket.io-client';
import { ConstantsComponent } from './constants.component';

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
describe('ConstantsComponent', () => {
    let component: ConstantsComponent;
    let fixture: ComponentFixture<ConstantsComponent>;
    let socketClient: SocketTestHelper;
    let socketClientServiceMock: MockSocketClientService;
    let fakeClock: jasmine.Clock;

    beforeEach(async () => {
        socketClient = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketClient as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [ConstantsComponent],
            providers: [{ provide: SocketClientService, useValue: socketClientServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConstantsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        fakeClock = jasmine.clock();
        fakeClock.install();
    });

    afterEach(() => {
        fakeClock.uninstall();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set gameConstants when receive loadConstant event', () => {
        const mockConstants = [
            { name: 'Temps initial du compte à rebours', time: 30 },
            { name: "Temps de pénalité pour l'utilisation d'un indice", time: 10 },
            { name: "Temps gagné avec la découverte d'une différence", time: 10 },
        ];
        socketClient.peerSideEmit('loadConstant', mockConstants);
        component.ngOnInit();
        expect(component.gameConstants).toEqual(mockConstants);
    });

    it('should set gameConstants when receive constant event', () => {
        const mockConstants = [
            { name: 'Temps initial du compte à rebours', time: 30 },
            { name: "Temps de pénalité pour l'utilisation d'un indice", time: 10 },
            { name: "Temps gagné avec la découverte d'une différence", time: 10 },
        ];
        socketClient.peerSideEmit('constant', mockConstants);
        component.ngOnInit();
        expect(component.gameConstants).toEqual(mockConstants);
    });

    it('should call clear method on mouseup event', () => {
        spyOn(component, 'clear');
        component.onKeyPress();
        expect(component.clear).toHaveBeenCalled();
    });

    it('should call send method of socketClientService with the expected arguments when modifyConstants', () => {
        const mockConstants = [
            { name: 'Temps initial du compte à rebours', time: 60 },
            { name: "Temps de pénalité pour l'utilisation d'un indice", time: 10 },
            { name: "Temps gagné avec la découverte d'une différence", time: 10 },
        ];
        component.gameConstants = mockConstants;
        spyOn(socketClientServiceMock, 'send');
        component.modifyConstants();
        expect(component.modify.nativeElement.disabled).toBe(true);
        expect(socketClientServiceMock.send).toHaveBeenCalledWith('constant', mockConstants);
    });

    it('should call send method of socketClientService with the expected arguments when set default values', () => {
        const mockConstants = [
            { name: 'Temps initial du compte à rebours', time: 30 },
            { name: "Temps de pénalité pour l'utilisation d'un indice", time: 5 },
            { name: "Temps gagné avec la découverte d'une différence", time: 5 },
        ];
        component.gameConstants = mockConstants;
        spyOn(socketClientServiceMock, 'send');
        component.setDefaultConstants();
        expect(socketClientServiceMock.send).toHaveBeenCalledWith('constant', mockConstants);
    });

    it('should increase the time of a constant when changeConstant is called with increase=true and the limit has not been reached', () => {
        component.gameConstants[0].time = CONFIG_CONSTANTS.INITIAL_TIME_MIN;
        const initialTime = component.gameConstants[0].time;
        component.changeConstant(0, true);
        expect(component.gameConstants[0].time).toBe(initialTime + CONFIG_CONSTANTS.INCREMENT);
    });

    it('changeConstant should increase the constant when called with increase=true if limit has not been reached with interval', fakeAsync(() => {
        component.gameConstants[0].time = CONFIG_CONSTANTS.INITIAL_TIME_MIN;
        const initialTime = component.gameConstants[0].time;
        component.changeConstant(0, true);
        tick(TIME.ONE_SECOND);
        component.clear();
        expect(component.gameConstants[0].time).toBeGreaterThan(initialTime);
    }));

    it('should decrease the time of a constant when changeConstant is called with increase=false and the limit has not been reached', () => {
        component.gameConstants[1].time = CONFIG_CONSTANTS.PENALTY_TIME_MAX;
        const initialTime = component.gameConstants[1].time;
        component.changeConstant(1, false);
        expect(component.gameConstants[1].time).toBe(initialTime + CONFIG_CONSTANTS.DECREMENT);
    });

    it('should not modify the time of a constant when the limit has been reached', () => {
        component.gameConstants[2].time = CONFIG_CONSTANTS.DISCOVER_TIME_MAX;
        const initialTime = component.gameConstants[2].time;
        component.changeConstant(2, true);
        expect(component.gameConstants[2].time).toBe(initialTime);
        component.changeConstant(2, false);
        expect(component.gameConstants[2].time).toBe(initialTime + CONFIG_CONSTANTS.DECREMENT);
    });

    it('should start an interval when the time of a constant is modified', fakeAsync(() => {
        component.gameConstants[1].time = CONFIG_CONSTANTS.PENALTY_TIME_MAX;
        component.changeConstant(1, false);
        expect(component.gameConstants[1].time).toBe(CONFIG_CONSTANTS.PENALTY_TIME_MAX + CONFIG_CONSTANTS.DECREMENT);
        fakeClock.tick(CONFIG_CONSTANTS.SPEED);
        expect(component.gameConstants[1].time).toBe(CONFIG_CONSTANTS.PENALTY_TIME_MAX + CONFIG_CONSTANTS.DECREMENT * 2);
        clearInterval(component.intervalId);
    }));

    it('the interval should stop when the limit is reached', fakeAsync(() => {
        spyOn(component, 'clear');
        component.gameConstants[1].time = CONFIG_CONSTANTS.PENALTY_TIME_MIN + CONFIG_CONSTANTS.INCREMENT;
        component.changeConstant(1, false);
        expect(component.gameConstants[1].time).toBe(CONFIG_CONSTANTS.PENALTY_TIME_MIN);
        fakeClock.tick(CONFIG_CONSTANTS.SPEED);
        expect(component.gameConstants[1].time).toBe(CONFIG_CONSTANTS.PENALTY_TIME_MIN);
        clearInterval(component.intervalId);
        expect(component.clear).toHaveBeenCalled();
    }));

    it('should stop the interval when limit is reached', () => {
        spyOn(component, 'clear');
        component.gameConstants[2].time = CONFIG_CONSTANTS.DISCOVER_TIME_MAX;
        component.changeConstant(2, true);
        expect(component.clear).toHaveBeenCalled();
    });

    it('should show error-message when the limit is reached', () => {
        component.gameConstants[0].time = CONFIG_CONSTANTS.INITIAL_TIME_MAX;
        component.changeConstant(0, true);
        expect(component.error.nativeElement.hidden).toBe(false);
    });

    it('clear should stop the interval', () => {
        fakeClock.uninstall();
        spyOn(window, 'clearInterval');
        component.clear();
        expect(window.clearInterval).toHaveBeenCalled();
    });
});
