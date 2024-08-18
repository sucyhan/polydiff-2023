import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SocketClientService } from '@app/services/socket-client.service';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@common/constants';
import { UsernameMessage } from '@common/messages';

@Component({
    selector: 'app-user-name-input',
    templateUrl: './user-name-input.component.html',
    styleUrls: ['./user-name-input.component.scss'],
})
export class UserNameInputComponent implements OnInit {
    @ViewChild('usernameInput') usernameInput: ElementRef;
    @Output() userNameReset = new EventEmitter<string>();

    @Input() showPopup: boolean = false;
    @Output() showPopupChange = new EventEmitter<boolean>();
    @Input() gameName: string = '';
    @Input() gameId: number = 0;
    @Output() openWaitingRoom = new EventEmitter<string>();
    showErrorMessage: boolean = false;
    userName: string = '';

    usernameInputForm = this.formBuilder.group({
        username: '',
    });

    readonly icon: string = 'close';
    constructor(private formBuilder: FormBuilder, public socketClient: SocketClientService) {
        this.socketClient.connect();
    }
    get username(): string {
        if (this.usernameInputForm.value != null) return this.usernameInputForm.value.username ? this.usernameInputForm.value.username : '';
        return '';
    }

    ngOnInit(): void {
        this.socketClient.on('verifyUsername', (verifier: boolean) => {
            if (verifier) {
                this.showErrorMessage = false;
                this.openWaitingRoom.emit(this.username);
            } else {
                this.showErrorMessage = true;
            }
        });
    }

    sendUsername() {
        localStorage.setItem('username', this.username);
        this.socketClient.send('verifyUsername', { username: this.usernameInputForm.value.username, id: this.gameId } as UsernameMessage);
    }
    verifyUsername(): boolean {
        return !(this.username.length < USERNAME_MIN_LENGTH || this.username.length > USERNAME_MAX_LENGTH);
    }

    verifyKeyPress(event: KeyboardEvent) {
        if (/[a-zA-Z0-9]/.test(event.key)) {
            return true;
        } else {
            event.preventDefault();
            return false;
        }
    }
}
