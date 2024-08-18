// Needed since we want the functions to have the same signature as the socket.io functions
/* eslint-disable no-unused-vars */
import { CallbackSignature, SocketParams } from '@common/interfaces';

export class SocketTestHelper {
    private callbacks = new Map<string, CallbackSignature[]>();
    connect(): void {
        return;
    }

    on(event: string, callback: CallbackSignature): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }

        this.callbacks.get(event)?.push(callback);
    }

    emit(event: string, ...params: SocketParams): void {
        return;
    }

    disconnect(): void {
        return;
    }

    send(event: string, params: SocketParams): void {
        return;
    }

    peerSideEmit(event: string, params?: SocketParams) {
        for (const callback of this.callbacks.get(event)?.slice() || []) {
            callback(params);
        }
    }
}
