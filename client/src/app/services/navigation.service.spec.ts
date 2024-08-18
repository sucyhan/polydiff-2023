import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FILE_TYPE } from '@common/constants';
import { GameData } from '@common/interfaces';
import { of } from 'rxjs';

import { NavigationService } from './navigation.service';
import { StorageService } from './storage.service';

class MockStorageService {
    mockGameType: GameData = {
        id: 0,
        title: 'test',
        difficulty: 'Facile',
        numberOfDifferences: 0,
        imageSrc: 'source',
        differences: [],
    };
    readFile(id: number, fileType: FILE_TYPE) {
        if (fileType === FILE_TYPE.imageJSON) {
            const mockResponse = JSON.stringify(this.mockGameType);
            return of(mockResponse);
        }
        return;
    }
    getAllValidIds() {
        return of({ validIds: [0] });
    }
}

describe('NavigationService', () => {
    let service: NavigationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [{ provide: StorageService, useClass: MockStorageService }],
        });
        service = TestBed.inject(NavigationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set correct current index', () => {
        service.currentIndex = 8;
        service.changeCurrentIndex(2);
        const dix = 10;
        expect(service.currentIndex).toEqual(dix);
    });

    it('getImages should load the correct number of gameData', () => {
        service.getImages([0]);
        expect(service.gameCards.length).toEqual(1);
    });

    it('getImages should call the storage service to get the correct gameData', () => {
        const spy = spyOn(service['storageService'], 'readFile').and.callThrough();
        service.getImages([0, 1]);
        expect(spy).toHaveBeenCalledWith(0, FILE_TYPE.imageJSON);
    });
});
