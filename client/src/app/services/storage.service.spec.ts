import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FILE_TYPE } from '@common/constants';
import { StorageService } from './storage.service';

describe('GameCommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: StorageService;
    let baseUrl: string;
    let fakeClock: jasmine.Clock;
    const testId = -1;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(StorageService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
        fakeClock = jasmine.clock();
        fakeClock.install();
    });

    afterEach(() => {
        httpMock.verify();
        fakeClock.uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('readFile should send a post request', () => {
        service.readFile(testId, FILE_TYPE.originalImage).subscribe();
        const req = httpMock.expectOne(`${baseUrl}/read`);
        expect(req.request.method).toBe('POST');
        req.flush('');
    });

    it('getAllValidIds should send a get request', () => {
        service.getAllValidIds().subscribe();
        const req = httpMock.expectOne(`${baseUrl}/getValidIds`);
        expect(req.request.method).toBe('GET');
        req.flush('');
    });

    it('modifyFile should send a post request', () => {
        service.modifyFile(testId, FILE_TYPE.originalImage, '').subscribe();
        const req = httpMock.expectOne(`${baseUrl}/modify`);
        expect(req.request.method).toBe('POST');
        req.flush('');
    });

    it('createFiles should send a post request', () => {
        const originalImageData = 'originalImageData';
        const modifiedImageData = 'modifiedImageData';
        const imageJSON = 'imageJSON';
        service.createFiles(originalImageData, modifiedImageData, imageJSON).subscribe();
        const req = httpMock.expectOne(`${baseUrl}/create`);
        expect(req.request.method).toBe('POST');
        req.flush('');
    });

    it('deleteFile should send a delete request', () => {
        service.deleteFiles(testId).subscribe();
        const req = httpMock.expectOne(`${baseUrl}/game?id=${testId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush('');
    });

    it('deleteAllFiles should send a delete request', () => {
        service.deleteAllFiles().subscribe();
        const req = httpMock.expectOne(`${baseUrl}/games`);
        expect(req.request.method).toBe('DELETE');
        req.flush('');
    });

    it('getAllValidIds should send a get request', () => {
        service.getAllValidIds().subscribe();
        const req = httpMock.expectOne(`${baseUrl}/getValidIds`);
        expect(req.request.method).toBe('GET');
        req.flush({ validIds: [] });
    });

    it('getBaseFile should send a get request', () => {
        const src = 'src';
        service.getBaseFile(src).subscribe();
        const req = httpMock.expectOne(src);
        expect(req.request.method).toBe('GET');
        req.flush(new Blob());
    });

    it('should handle http error safely', () => {
        service.readFile(testId, FILE_TYPE.imageJSON).subscribe({
            next: (response: string) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/read`);
        expect(req.request.method).toBe('POST');
        req.error(new ProgressEvent('Random error occurred'));
    });
});
