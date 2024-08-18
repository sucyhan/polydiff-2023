import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SocketClientService } from '@app/services/socket-client.service';
import { StorageService } from '@app/services/storage.service';
import { GAME_PLAYER_MODE, PAGE_TYPE, USERS_1V1_RANKING, USERS_SOLO_RANKING } from '@common/constants';
import { GameRankings, UsersScore } from '@common/interfaces';

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
})
export class GameCardComponent implements AfterViewInit, OnChanges {
    @ViewChild('Card') gameCard: ElementRef<HTMLDivElement>;
    @ViewChild('Button') button: ElementRef<HTMLButtonElement>;
    @ViewChild('Button1') button1Elem: ElementRef<HTMLButtonElement>;

    @Input() button1: string = 'Jouer';
    @Input() button2: string = 'Créer';
    @Input() difficulty: string = 'Facile';
    @Input() gameName: string = 'Nom du jeu';
    @Input() imgSrc: string = '/assets/pixel.bmp';
    @Input() id: number = 0;
    @Input() isSelection: boolean = false;
    @Input() isAvailableToCreate: boolean = true;

    @Output() multiplayerOpen = new EventEmitter<string>();
    @Input() index: number = 0;
    @Output() deleteEvent = new EventEmitter<string>();

    link: string = '/classic/singlePlayer/';
    pageType: PAGE_TYPE;
    usersSolo = USERS_SOLO_RANKING;
    users1v1 = USERS_1V1_RANKING;
    constructor(private router: Router, private readonly storageService: StorageService, private readonly socketClient: SocketClientService) {}

    ngOnChanges() {
        if (this.isSelection) {
            this.socketClient.on('createdGame', (id: number) => {
                if (this.id === id - 1 && this.isSelection) {
                    this.isAvailableToCreate = false;
                    this.setUpButtons();
                }
            });

            this.socketClient.on('deletedWaitingRoom', (id: number) => {
                if (this.id === id - 1 && this.isSelection) {
                    this.isAvailableToCreate = true;
                    this.setUpButtons();
                }
            });
            this.socketClient.on('creatorLeft', (id: number) => {
                if (this.id === id - 1 && this.isSelection) {
                    this.isAvailableToCreate = true;
                }
                this.setUpButtons();
            });
        }
    }

    ngAfterViewInit(): void {
        this.pageType = this.isSelection ? PAGE_TYPE.Selection : PAGE_TYPE.Configuration;
        this.socketClient.on('isCardCreating', (data: [boolean, number]) => {
            if (data[0] && this.id === data[1] && this.isSelection) {
                this.isAvailableToCreate = false;
            }
            this.setUpButtons();
        });
        this.socketClient.on('getAllScores', (data: [number, GameRankings]) => {
            if (data[0] === this.id) {
                this.usersSolo = data[1].singlePlayer;
                this.users1v1 = data[1].multiPlayer;
            }
        });
        this.socketClient.on('newRecord', (data: [number, string, UsersScore[]]) => {
            if (data[0] === this.id) {
                if (data[1] === GAME_PLAYER_MODE.MULTI_PLAYER) {
                    this.users1v1 = data[2];
                } else if (data[1] === GAME_PLAYER_MODE.SINGLE_PLAYER) {
                    this.usersSolo = data[2];
                }
            }
        });
        this.socketClient.send('isCardCreating', this.id);
        this.socketClient.send('getAllScores', this.id);
    }

    setUpButtons() {
        if (this.isSelection) {
            if (this.isAvailableToCreate) {
                this.button2 = 'Créer';
            } else {
                this.button2 = 'Joindre';
            }
        } else {
            this.button1Elem.nativeElement.disabled = false;
        }
    }

    navigateTo() {
        this.router.navigate([this.link + this.id], { skipLocationChange: true });
    }
    hide() {
        this.gameCard.nativeElement.style.visibility = 'hidden';
    }

    show() {
        this.gameCard.nativeElement.style.visibility = 'visible';
    }

    leftButtonBehavior() {
        if (this.isSelection) {
            this.navigateTo();
        } else {
            this.socketClient.send('resetGameScores', this.id);
        }
    }

    rightButtonBehavior() {
        if (!this.isSelection) {
            if (window.confirm('Êtes-vous sûr de vouloir supprimer le jeu?')) {
                this.delete();
            }
        } else {
            this.multiplayerOpen.emit();
        }
    }

    delete() {
        this.storageService.deleteFiles(this.id).subscribe(() => {
            this.emitEventToParent();
            this.socketClient.send('deletedFromServer', this.id + 1);
        });
    }

    emitEventToParent() {
        this.deleteEvent.emit('Delete');
    }
}
