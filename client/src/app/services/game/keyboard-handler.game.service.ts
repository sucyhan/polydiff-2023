import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class KeyboardGameService {
    buttonPressed = '';

    onKeyDown(event: KeyboardEvent) {
        this.buttonPressed = event.key;
    }
}
