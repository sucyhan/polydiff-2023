import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';

import { SocketClientService } from './socket-client.service';

describe('SocketClientService', () => {
    let service: SocketClientService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('isSocketAlive should return false if socket is not connected', () => {
        expect(service.isSocketAlive()).toBeFalsy();
    });

    it('isSocketAlive should return true if socket is connected', () => {
        service.socket = { connected: true } as Socket;
        expect(service.isSocketAlive()).toBeTruthy();
    });

    it('connect should create a socket if it does not exist', () => {
        spyOn(service, 'isSocketAlive').and.returnValue(false);
        service.connect();
        expect(service.socket).toBeTruthy();
    });

    it('connect should not create a socket if it already exists', () => {
        spyOn(service, 'isSocketAlive').and.returnValue(true);
        service.connect();
        expect(service.socket).toBeFalsy();
    });

    it('disconnect should disconnect the socket if it exists', () => {
        service.socket = {
            connected: true,
            disconnect: () => {
                return;
            },
        } as unknown as Socket;
        spyOn(service.socket, 'disconnect');
        service.disconnect();
        expect(service.socket.disconnect).toHaveBeenCalled();
    });

    it('on should call socket.on', () => {
        service.socket = {
            on: () => {
                return;
            },
        } as unknown as Socket;
        spyOn(service.socket, 'on');
        service.on('test', () => {
            return;
        });
        expect(service.socket.on).toHaveBeenCalled();
    });

    it('send should call socket.emit with data', () => {
        service.socket = {
            emit: () => {
                return;
            },
        } as unknown as Socket;
        spyOn(service.socket, 'emit');
        service.send('test', 'data');
        expect(service.socket.emit).toHaveBeenCalledWith('test', 'data');
    });

    it('send should call socket.emit without data', () => {
        service.socket = {
            emit: () => {
                return;
            },
        } as unknown as Socket;
        spyOn(service.socket, 'emit');
        service.send('test');
        expect(service.socket.emit).toHaveBeenCalledWith('test');
    });
});
