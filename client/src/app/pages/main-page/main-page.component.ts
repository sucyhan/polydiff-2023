import { Component } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly title: string = 'Jeu de différences';
    readonly icon: string = '';
    readonly logoSrc: string = 'assets/logo.png';
    readonly options: { name: string; link: string }[] = [
        { name: 'Mode Classique', link: '/select' },
        { name: 'Mode Temps Limité', link: '/timed' },
        { name: 'Mode Configuration', link: '/config' },
    ];
    readonly teamNumber: string = '303';
    readonly teamMembers: string[] = [
        'Farid Bakir,',
        'Louis-Philippe Daigle,',
        'Sucy Han,',
        'Aurélie Nichols,',
        'Anne Raymond,',
        'Enrique Arsenio Rodriguez Rodriguez',
    ];
    constructor(private readonly socket: SocketClientService) {
        localStorage.setItem('username', '');
        this.socket.connect();
    }
}
