import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { StateGameService } from '@app/services/game/state.game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { MINIMUM_GAME_AMOUNT, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@common/constants';
import { ValidIdsMessage } from '@common/messages';

@Component({
    selector: 'app-timed-waiting-page',
    templateUrl: './timed-waiting-page.component.html',
    styleUrls: ['./timed-waiting-page.component.scss'],
})
export class TimedWaitingPageComponent implements OnInit {
    isWaiting = false;
    validIds: number[] = [];
    errorMessages: string[] = [];
    readonly title: string = 'Mode temps limité';
    readonly icon: string = 'home';
    usernameInputForm = this.formBuilder.group({
        username: '',
    });
    // Service injection
    // eslint-disable-next-line max-params
    constructor(
        private readonly clientSocket: SocketClientService,
        private readonly storageService: StorageService,
        private readonly router: Router,
        private formBuilder: FormBuilder,
        private readonly stateGameService: StateGameService,
    ) {}
    get username(): string {
        if (this.usernameInputForm.value !== null) return this.usernameInputForm.value.username ? this.usernameInputForm.value.username : '';
        return '';
    }

    ngOnInit(): void {
        this.clientSocket.connect();
        this.clientSocket.on('timedUsernameTaken', () => {
            this.isWaiting = false;
            this.errorMessages.push("Ce nom d'utilisateur est déjà pris");
        });
        this.clientSocket.on('timedUsernameAvailable', () => {
            this.errorMessages = [];
            this.isWaiting = true;
            this.clientSocket.socket.emit('timedFindGame', this.username);
        });
        this.clientSocket.on('timedGameFound', (data: [number, string, string]) => {
            this.stateGameService.gameData.id = data[0];
            this.stateGameService.gameDataChanged.next(this.stateGameService.gameData);
            this.router.navigate(['/timed/multiPlayer/' + data[1] + '/' + data[2]], { skipLocationChange: true });
        });

        this.clientSocket.on('numberGamesChanged', () => {
            this.storageService.getAllValidIds().subscribe((message: ValidIdsMessage) => {
                this.validIds = message.validIds;
                this.checkError();
            });
        });

        this.storageService.getAllValidIds().subscribe((message: ValidIdsMessage) => {
            this.validIds = message.validIds;
            this.checkError();
        });
    }

    modeSolo() {
        if (!this.verifyGamePossible()) return;
        this.storageService.getAllValidIds().subscribe(() => {
            this.router.navigate(['/timed/singlePlayer/' + this.username], { skipLocationChange: true });
        });
    }

    modeCoop() {
        if (!this.verifyGamePossible()) return;
        this.clientSocket.socket.emit('timedCheckUsername', this.username);
        return;
    }

    getRandomId(ids: number[]) {
        return ids[Math.floor(Math.random() * ids.length)];
    }
    verifyGamePossible(): boolean {
        return !(
            this.username.length < USERNAME_MIN_LENGTH ||
            this.username.length > USERNAME_MAX_LENGTH ||
            this.validIds.length < MINIMUM_GAME_AMOUNT
        );
    }
    checkError(): void {
        if (this.validIds.length < MINIMUM_GAME_AMOUNT) {
            this.errorMessages.push('Le nombre de jeux est insuffisant');
            this.isWaiting = false;
            this.clientSocket.socket.emit('timedAbandon');
        } else if (this.validIds.length >= MINIMUM_GAME_AMOUNT) {
            this.errorMessages = this.errorMessages.filter((message) => message !== 'Le nombre de jeux est insuffisant');
        }
    }
    verifyKeyPress(event: KeyboardEvent) {
        if (/[a-zA-Z0-9]/.test(event.key)) {
            return true;
        } else {
            event.preventDefault();
            return false;
        }
    }

    abandon() {
        this.clientSocket.socket.emit('timedAbandon');
        this.clientSocket.socket.disconnect();
        this.router.navigate(['/home']);
    }
}
