import { TestBed } from '@angular/core/testing';
import { KeyboardGameService } from './keyboard-handler.game.service';

describe('KeyboardHandlerService', () => {
    let service: KeyboardGameService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(KeyboardGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('onKeyDown should set buttonPressed to the key pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        service.onKeyDown(event);
        expect(service.buttonPressed).toEqual('a');
    });
});
