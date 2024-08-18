import { FILE_EXTENSION, FILE_TYPE } from '@common/constants';
import { GameData } from '@common/interfaces';
import { ValidIdsMessage } from '@common/messages';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'fs/promises';
import { Service } from 'typedi';

@Service()
export class StorageService {
    baseDirectory: string = './data/';

    constructor() {
        this.init();
    }

    async init(): Promise<void> {
        await this.createDirectory(this.baseDirectory);
        await this.createDirectory(this.baseDirectory + FILE_TYPE.imageJSON + '/');
        await this.createDirectory(this.baseDirectory + FILE_TYPE.originalImage + '/');
        await this.createDirectory(this.baseDirectory + FILE_TYPE.modifiedImage + '/');
    }

    async createDirectory(directory: string): Promise<void> {
        if (await this.checkDirectory(directory)) return;
        await mkdir(directory, { recursive: true });
        return;
    }

    async checkDirectory(directory: string): Promise<boolean> {
        return new Promise((resolve) => {
            stat(directory)
                .then(() => resolve(true))
                .catch(() => resolve(false));
        });
    }

    async deleteDirectory(directory: string): Promise<void> {
        if (await this.checkDirectory(directory)) {
            await rm(directory, { recursive: true });
        }
        return;
    }

    async readFile(id: number, type: FILE_TYPE): Promise<string> {
        if (await this.fileExists(id, type)) {
            return (await readFile(this.getPath(id, type))).toString('utf-8');
        }
        return '';
    }

    async writeFile(id: number, data: string, type: FILE_TYPE): Promise<void> {
        await writeFile(this.getPath(id, type), data);
    }

    async writeImage(id: number, data: Buffer, type: FILE_TYPE): Promise<void> {
        await writeFile(this.getPath(id, type), data);
    }

    async deleteFile(id: number, type: FILE_TYPE): Promise<void> {
        if (await this.fileExists(id, type)) {
            await rm(this.getPath(id, type));
        }
    }

    async deleteAll() {
        const gameIDs = await this.getValidIds();
        gameIDs.validIds.forEach(async (id) => {
            await this.deleteFile(id, FILE_TYPE.imageJSON);
            await this.deleteFile(id, FILE_TYPE.originalImage);
            await this.deleteFile(id, FILE_TYPE.modifiedImage);
        });
    }

    async fileExists(id: number, type: FILE_TYPE): Promise<boolean> {
        return await this.checkDirectory(this.getDirectory(type) + id + this.getFileExtension(type));
    }

    async getNewId(): Promise<number> {
        const id = await this.findNextId();
        return id;
    }

    async findNextId(): Promise<number> {
        let id = 1;
        while (await this.fileExistsWithId(id)) {
            id++;
        }
        return id;
    }

    async fileExistsWithId(id: number): Promise<boolean> {
        return this.fileExists(id, FILE_TYPE.imageJSON);
    }

    getFileExtension(type: FILE_TYPE): string {
        return FILE_EXTENSION[type];
    }

    getDirectory(type: FILE_TYPE): string {
        return this.baseDirectory + type + '/';
    }

    getFileName(id: number, type: FILE_TYPE): string {
        return id + this.getFileExtension(type);
    }

    getPath(id: number, type: FILE_TYPE): string {
        return this.getDirectory(type) + this.getFileName(id, type);
    }

    async getImageObject(id: number): Promise<GameData> {
        const data = await this.readFile(id, FILE_TYPE.imageJSON);
        return JSON.parse(data);
    }

    async getValidIds(): Promise<ValidIdsMessage> {
        const validIds: number[] = [];
        const files = await readdir(this.getDirectory(FILE_TYPE.imageJSON), { withFileTypes: true });
        for (const file of files) {
            if (file.isFile() && file.name.endsWith(this.getFileExtension(FILE_TYPE.imageJSON))) {
                validIds.push(parseInt(file.name.replace(this.getFileExtension(FILE_TYPE.imageJSON), ''), 10));
            }
        }
        validIds.sort((a, b) => a - b);
        return { validIds };
    }
}
