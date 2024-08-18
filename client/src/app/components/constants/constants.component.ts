import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { CONFIGURATION_GAME_CONSTANTS, CONFIG_CONSTANTS } from '@common/constants';
import { GameConstants, UsersScore } from '@common/interfaces';

@Component({
    selector: 'app-constants',
    templateUrl: './constants.component.html',
    styleUrls: ['./constants.component.scss'],
})
export class ConstantsComponent implements OnInit {
    @Input() time: number;
    @ViewChild('Modify') modify: ElementRef<HTMLButtonElement>;
    @ViewChild('Error') error: ElementRef<HTMLSpanElement>;
    gameConstants: GameConstants[] = CONFIGURATION_GAME_CONSTANTS;
    readonly constantUnit: string = 'sec';
    intervalId: ReturnType<typeof setTimeout> = setTimeout(() => ({}));
    private readonly verifiers = [
        [CONFIG_CONSTANTS.INITIAL_TIME_MIN, CONFIG_CONSTANTS.INITIAL_TIME_MAX],
        [CONFIG_CONSTANTS.PENALTY_TIME_MIN, CONFIG_CONSTANTS.PENALTY_TIME_MAX],
        [CONFIG_CONSTANTS.DISCOVER_TIME_MIN, CONFIG_CONSTANTS.DISCOVER_TIME_MAX],
    ];

    constructor(readonly socketClient: SocketClientService) {}

    @HostListener('window:mouseup', ['$event'])
    onKeyPress() {
        this.clear();
    }

    ngOnInit() {
        this.socketClient.connect();
        this.socketClient.on('loadConstant', (info: UsersScore[]) => {
            this.gameConstants = info;
            this.modify.nativeElement.disabled = true;
        });
        this.socketClient.on('constant', (info: UsersScore[]) => {
            this.gameConstants = info;
            this.modify.nativeElement.disabled = true;
        });
        this.socketClient.send('getConstant');
    }
    modifyConstants() {
        this.modify.nativeElement.disabled = true;
        this.socketClient.send('constant', this.gameConstants);
        this.error.nativeElement.hidden = true;
    }
    setDefaultConstants() {
        this.gameConstants = [
            { name: 'Temps initial du compte à rebours', time: 30 },
            { name: "Temps de pénalité pour l'utilisation d'un indice", time: 5 },
            { name: "Temps gagné avec la découverte d'une différence", time: 5 },
        ];
        this.modify.nativeElement.disabled = true;
        this.socketClient.send('constant', this.gameConstants);
    }
    changeConstant(index: number, increase: boolean) {
        const limit = increase ? this.verifiers[index][1] : this.verifiers[index][0];
        const step = increase ? CONFIG_CONSTANTS.INCREMENT : CONFIG_CONSTANTS.DECREMENT;

        if (this.gameConstants[index].time !== limit) {
            this.modify.nativeElement.disabled = false;
            this.error.nativeElement.hidden = true;
            this.gameConstants[index].time += step;

            this.intervalId = setInterval(() => {
                if (this.gameConstants[index].time === limit) {
                    this.clear();
                    this.error.nativeElement.hidden = false;
                } else {
                    this.gameConstants[index].time += step;
                }
            }, CONFIG_CONSTANTS.SPEED);
        } else {
            this.clear();
            this.error.nativeElement.hidden = false;
        }
    }

    clear() {
        clearInterval(this.intervalId);
    }
}
