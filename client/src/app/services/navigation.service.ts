import { Injectable } from '@angular/core';
import { FILE_TYPE } from '@common/constants';
import { GameCardType, GameData } from '@common/interfaces';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root',
})
export class NavigationService {
    currentIndex: number = 0;
    gameCards: GameCardType[] = [];
    gameCardsChanged: Subject<GameCardType[]> = new Subject<GameCardType[]>();
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private readonly storageService: StorageService) {}

    changeCurrentIndex(n: number) {
        this.currentIndex += n;
    }

    getImages(ids: number[]) {
        const tempGameCards: GameCardType[] = [];
        const nbGameCards = 4;
        for (let i = this.currentIndex; i < ids.length && i < this.currentIndex + nbGameCards; i++) {
            this.storageService.readFile(ids[i], FILE_TYPE.imageJSON).subscribe((response) => {
                const gameData: GameData = JSON.parse(response);
                gameData.imageSrc = `${this.baseUrl}/storage/originalImage/${ids[i]}.bmp?` + new Date().getTime();
                tempGameCards.push({ game: gameData, isAvailable: true });
                tempGameCards.sort((a, b) => a.game.id - b.game.id);
            });
        }
        this.gameCards = tempGameCards;
        this.gameCardsChanged.next(this.gameCards);
    }
}
