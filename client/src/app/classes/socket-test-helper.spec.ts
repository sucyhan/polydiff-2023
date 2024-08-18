import { CALLBACK } from '@common/constants';
import { SocketTestHelper } from './socket-test-helper';

describe('SocketTestHelper', () => {
    let socketTestHelper: SocketTestHelper;

    beforeEach(() => {
        socketTestHelper = new SocketTestHelper();
    });

    it('should be created', () => {
        expect(socketTestHelper).toBeTruthy();
    });

    it('connect should do nothing', () => {
        const connectSpy = spyOn(socketTestHelper, 'connect');
        socketTestHelper.connect();
        expect(connectSpy).toHaveBeenCalled();
    });

    it('on should add callback to callbacks map', () => {
        const event = 'event';
        socketTestHelper.on(event, CALLBACK);
        expect(socketTestHelper['callbacks'].get(event)).toContain(CALLBACK);
    });

    it('on should not add callback to callbacks map if it cannot find it', () => {
        const event = 'event';
        const getSpy = spyOn(socketTestHelper['callbacks'], 'get').and.returnValue(undefined);
        socketTestHelper.on(event, CALLBACK);
        getSpy.and.callThrough();
        expect(socketTestHelper['callbacks'].get('a')).not.toContain(CALLBACK);
    });

    it('emit should do nothing', () => {
        const emitSpy = spyOn(socketTestHelper, 'emit');
        socketTestHelper.emit('event', [1, '', {}]);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('emit should do nothing with no params', () => {
        const emitSpy = spyOn(socketTestHelper, 'emit');
        socketTestHelper.emit('event');
        expect(emitSpy).toHaveBeenCalled();
    });

    it('disconnect should do nothing', () => {
        const disconnectSpy = spyOn(socketTestHelper, 'disconnect');
        const returnValue = socketTestHelper.disconnect();
        expect(disconnectSpy).toHaveBeenCalled();
        expect(returnValue).toEqual(undefined);
    });

    it('send should do nothing', () => {
        const sendSpy = spyOn(socketTestHelper, 'send');
        socketTestHelper.send('event', {});
        expect(sendSpy).toHaveBeenCalled();
    });

    it('peerSideEmit should call callback', () => {
        const event = 'event';
        const callbackSpy = jasmine.createSpy('callback');
        socketTestHelper.on(event, callbackSpy);
        socketTestHelper.peerSideEmit(event);
        expect(callbackSpy).toHaveBeenCalled();
    });

    it('peerSideEmit should call callback with params', () => {
        const event = 'event';
        const callbackSpy = jasmine.createSpy('callback');
        const params = {};
        socketTestHelper.on(event, callbackSpy);
        socketTestHelper.peerSideEmit(event, params);
        expect(callbackSpy).toHaveBeenCalledWith(params);
    });

    it('peerSideEmit should not call callback if event is not in callbacks map', () => {
        const event = 'event';
        const callbackSpy = jasmine.createSpy('callback');
        socketTestHelper.on(event, callbackSpy);
        socketTestHelper.peerSideEmit('otherEvent');
        expect(callbackSpy).not.toHaveBeenCalled();
    });
});
