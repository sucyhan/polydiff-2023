import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FILE_TYPE } from '@common/constants';
import { UsersScore } from '@common/interfaces';
import { ValidIdsMessage } from '@common/messages';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    private readonly baseUrl: string = environment.serverUrl + '/storage';

    constructor(private readonly http: HttpClient) {}

    readFile(id: number, type: FILE_TYPE): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/read`, { id, type }).pipe(catchError(this.handleError<string>('readFile')));
    }

    modifyFile(id: number, type: FILE_TYPE, data: string): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/modify`, { id, type, data }).pipe(catchError(this.handleError<string>('modifyFile')));
    }

    createFiles(originalImageData: string, modifiedImageData: string, imageJSON: string): Observable<string> {
        return this.http
            .post<string>(`${this.baseUrl}/create`, { originalImageData, modifiedImageData, imageJSON })
            .pipe(catchError(this.handleError<string>('createFiles')));
    }

    deleteFiles(id: number): Observable<string> {
        const options = { params: new HttpParams().set('id', id.toString()) };
        return this.http.delete<string>(`${this.baseUrl}/game`, options).pipe(catchError(this.handleError<string>('deleteFiles')));
    }

    deleteAllFiles(): Observable<string> {
        return this.http.delete<string>(`${this.baseUrl}/games`).pipe(catchError(this.handleError<string>('deleteFiles')));
    }

    getAllValidIds(): Observable<ValidIdsMessage> {
        return this.http.get<ValidIdsMessage>(`${this.baseUrl}/getValidIds`).pipe(catchError(this.handleError<ValidIdsMessage>('getAllValidIds')));
    }

    getBaseFile(src: string): Observable<Blob> {
        return this.http.get(src, { responseType: 'blob' }).pipe(catchError(this.handleError<Blob>('getBaseFile')));
    }

    getScore(id: number, gamePlayerMode: string): Observable<UsersScore[]> {
        return this.http
            .post<UsersScore[]>(`${this.baseUrl}/score`, { id, gamePlayerMode })
            .pipe(catchError(this.handleError<UsersScore[]>('score')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
