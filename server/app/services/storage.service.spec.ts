import { FILE_TYPE } from '@common/constants';
import { GameData } from '@common/interfaces';
import { expect } from 'chai';
import { existsSync, mkdir, mkdirSync, rmSync, writeFileSync } from 'fs';
import { SinonSpy, SinonStub, spy, stub } from 'sinon';
import { StorageService } from './storage.service';
import { ValidIdsMessage } from '@common/messages';

describe('Storage Service', () => {
    let storageService: StorageService;
    let storageServiceSpy: SinonSpy;
    const testId = -1;
    const baseDirectory = './testData/';
    const testPath = baseDirectory + 'testPath';
    let initSpy: SinonStub;

    const gameObject: GameData = {
        id: 0,
        title: '',
        difficulty: '',
        numberOfDifferences: 0,
        differences: [{ rectangles: [{ point1: { x: 0, y: 0 }, point2: { x: 10, y: 10 } }] }],
    };

    before(async () => {
        initSpy = stub(StorageService.prototype, 'init');
    });

    beforeEach(async () => {
        storageService = new StorageService();
        storageService.baseDirectory = baseDirectory;
    });

    afterEach(async () => {
        if (existsSync(baseDirectory)) rmSync(baseDirectory, { recursive: true, force: true });
    });

    after(async () => {
        initSpy.restore();
    });

    it('init should create the base directory', async () => {
        initSpy.callThrough();
        rmSync(baseDirectory, { recursive: true, force: true });
        expect(existsSync(baseDirectory)).to.equal(false);
        await storageService.init();
        expect(existsSync(baseDirectory)).to.equal(true);
        expect(initSpy.called).to.equal(true);
        initSpy.callsFake(() => {
            return;
        });
    });

    it('createDirectory should create a directory', async () => {
        storageServiceSpy = spy(storageService, 'createDirectory');
        stub(storageService, 'checkDirectory').resolves(false);
        await storageService.createDirectory(testPath);
        expect(existsSync(testPath)).to.equal(true);
        expect(storageServiceSpy.called).to.equal(true);
        rmSync(testPath, { recursive: true });
    });

    it('createDirectory should not create a directory if it already exists', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'createDirectory');
        stub(storageService, 'checkDirectory').resolves(true);
        mkdirSync(testPath);
        const mkdirSpy = spy(mkdir);
        await storageService.createDirectory(testPath);
        expect(mkdirSpy.called).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(testPath, { recursive: true });
    });

    it('checkDirectory should return true if directory exists', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'checkDirectory');
        mkdirSync(testPath);
        const directoryExists = await storageService.checkDirectory(testPath);
        expect(directoryExists).to.equal(true);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(testPath, { recursive: true });
    });

    it('checkDirectory should return false if directory does not exist', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'checkDirectory');
        const directoryExists = await storageService.checkDirectory(testPath);
        expect(directoryExists).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('deleteDirectory should delete a directory', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'deleteDirectory');
        mkdirSync(testPath);
        await storageService.deleteDirectory(testPath);
        expect(existsSync(testPath)).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('deleteDirectory should not delete a directory if it does not exist', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'deleteDirectory');
        const rmSyncSpy = spy(rmSync);
        await storageService.deleteDirectory(testPath);
        expect(rmSyncSpy.called).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('fileExists should return false if file does not exists', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'fileExists');
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        if (!existsSync(filePath)) mkdirSync(filePath);
        if (existsSync(`${filePath}${testId}.json`)) rmSync(`${filePath}${testId}.json`);
        expect(await storageService.fileExists(testId, FILE_TYPE.imageJSON)).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('fileExists should return true if file exists', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'fileExists');
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        if (!existsSync(filePath)) mkdirSync(filePath);
        writeFileSync(`${filePath}${testId}.json`, JSON.stringify(gameObject));
        expect(await storageService.fileExists(testId, FILE_TYPE.imageJSON)).to.equal(true);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${filePath}${testId}.json`, { recursive: true });
    });

    it('readFile should return the content of a file', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'readFile');
        stub(storageService, 'fileExists').resolves(true);
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        const fileContent = { test: 'test' };
        if (!existsSync(filePath)) mkdirSync(filePath);
        writeFileSync(`${filePath}${testId}.json`, JSON.stringify(fileContent));
        expect(JSON.parse(await storageService.readFile(testId, FILE_TYPE.imageJSON))).to.eql(fileContent);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${filePath}${testId}.json`, { recursive: true });
    });

    it('readFile should return an empty object if file does not exist', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'readFile');
        stub(storageService, 'fileExists').resolves(false);
        expect(await storageService.readFile(testId, FILE_TYPE.imageJSON)).to.eql('');
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('writeFile should write a file', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'writeFile');
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        const fileContent = '{ "test": "test" }';
        stub(storageService, 'getPath').withArgs(testId, FILE_TYPE.imageJSON).returns(`${filePath}${testId}.json`);
        if (!existsSync(filePath)) mkdirSync(filePath);
        await storageService.writeFile(testId, fileContent, FILE_TYPE.imageJSON);
        expect(existsSync(`${filePath}${testId}.json`)).to.equal(true);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${filePath}${testId}.json`, { recursive: true });
    });

    it('writeImage should write an Image', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'writeImage');
        const filePath = `${baseDirectory}${FILE_TYPE.originalImage}/`;
        const fileContent = Buffer.from('test');
        stub(storageService, 'getPath').withArgs(testId, FILE_TYPE.originalImage).returns(`${filePath}${testId}.json`);
        if (!existsSync(filePath)) mkdirSync(filePath);
        await storageService.writeImage(testId, fileContent, FILE_TYPE.originalImage);
        expect(existsSync(`${filePath}${testId}.json`)).to.equal(true);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${filePath}${testId}.json`, { recursive: true });
    });

    it('deleteFile should delete a file', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'deleteFile');
        stub(storageService, 'fileExists').resolves(true);
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        const fileContent = { test: 'test' };
        if (!existsSync(filePath)) mkdirSync(filePath);
        writeFileSync(`${filePath}${testId}.json`, JSON.stringify(fileContent));
        await storageService.deleteFile(testId, FILE_TYPE.imageJSON);
        expect(existsSync(`${filePath}${testId}.json`)).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        if (existsSync(`${filePath}${testId}.json`)) rmSync(`${filePath}${testId}.json`, { recursive: true });
    });

    it('deleteFile should not delete a file if it does not exist', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'deleteFile');
        stub(storageService, 'fileExists').resolves(false);
        const rmSyncSpy = spy(rmSync);
        await storageService.deleteFile(testId, FILE_TYPE.imageJSON);
        expect(rmSyncSpy.called).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('deleteAll should get valid Ids and delete file for each id', async () => {
        createBaseDirectory();
        const getSpy = stub(storageService, 'getValidIds').resolves({ validIds: [1] } as ValidIdsMessage);
        const deleteSpy = stub(storageService, 'deleteFile').resolves();
        await storageService.deleteAll();
        expect(getSpy.calledOnce).to.equal(true);
        expect(deleteSpy.called).to.equal(true);
    });

    it('getNewId should return a new id', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getNewId');
        stub(storageService, 'findNextId').resolves(0);
        expect(await storageService.getNewId()).to.equal(0);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('findNextId should return the next id', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'findNextId');
        stub(storageService, 'fileExistsWithId').withArgs(2).resolves(false).withArgs(1).resolves(true).withArgs(0).resolves(true);
        expect(await storageService.findNextId()).to.equal(2);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('fileExistsWithId should return true if file exists', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'fileExistsWithId');
        stub(storageService, 'fileExists').resolves(true);
        expect(await storageService.fileExistsWithId(testId)).to.equal(true);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('fileExistsWithId should return false if file does not exist', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'fileExistsWithId');
        stub(storageService, 'fileExists').resolves(false);
        expect(await storageService.fileExistsWithId(testId)).to.equal(false);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('getFileExtension should return the file extension from FILE_TYPE', () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getFileExtension');
        expect(storageService.getFileExtension(FILE_TYPE.imageJSON)).to.equal('.json');
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('getDirectory should return the directory from FILE_TYPE', () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getDirectory');
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        expect(storageService.getDirectory(FILE_TYPE.imageJSON)).to.equal(filePath);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('getFileName should return the file names from a directory', () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getFileName');
        stub(storageService, 'getFileExtension').returns('.json');
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        const fileContent = { test: 'test' };
        if (!existsSync(filePath)) mkdirSync(filePath);
        writeFileSync(`${filePath}${testId}.json`, JSON.stringify(fileContent));
        expect(storageService.getFileName(testId, FILE_TYPE.imageJSON)).to.eql(`${testId}.json`);
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${filePath}${testId}.json`, { recursive: true });
    });

    it('getPath should return the path from a directory', () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getPath');
        const filePath = `${baseDirectory}${FILE_TYPE.imageJSON}/`;
        stub(storageService, 'getDirectory').returns(filePath);
        stub(storageService, 'getFileName').returns(`${testId}.json`);
        expect(storageService.getPath(testId, FILE_TYPE.imageJSON)).to.eql(`${filePath}${testId}.json`);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('getImageObject should return the image object', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getImageObject');
        stub(storageService, 'readFile').resolves(JSON.stringify(gameObject));
        expect(await storageService.getImageObject(testId)).to.eql(gameObject);
        expect(storageServiceSpy.calledOnce).to.equal(true);
    });

    it('getValidIds should return the valid ids', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getValidIds');
        stub(storageService, 'getDirectory').returns(`${testPath}/`);
        stub(storageService, 'getFileExtension').returns('.bmp');
        if (!existsSync(testPath)) mkdirSync(testPath);
        if (!existsSync(`${testPath}/${testId}.bmp`)) writeFileSync(`${testPath}/${testId}.bmp`, '');
        expect(await storageService.getValidIds()).to.eql({ validIds: [testId] });
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${testPath}/${testId}.bmp`, { recursive: true });
        rmSync(testPath, { recursive: true });
    });

    it('getValidIds should return an empty array if no valid ids or wrong file types', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getValidIds');
        stub(storageService, 'getDirectory').returns(`${testPath}/`);
        stub(storageService, 'getFileExtension').returns('.bmp');
        if (!existsSync(testPath)) mkdirSync(testPath);
        if (!existsSync(`${testPath}/${testId}.png`)) writeFileSync(`${testPath}/${testId}.png`, '');
        expect(await storageService.getValidIds()).to.eql({ validIds: [] });
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${testPath}/${testId}.png`, { recursive: true });
        rmSync(testPath, { recursive: true });
    });

    it('getValidIds should sort the ids', async () => {
        createBaseDirectory();
        storageServiceSpy = spy(storageService, 'getValidIds');
        stub(storageService, 'getDirectory').returns(`${testPath}/`);
        stub(storageService, 'getFileExtension').returns('.bmp');
        if (!existsSync(testPath)) mkdirSync(testPath);
        if (!existsSync(`${testPath}/${testId}.bmp`)) writeFileSync(`${testPath}/${testId}.bmp`, '');
        if (!existsSync(`${testPath}/${testId - 1}.bmp`)) writeFileSync(`${testPath}/${testId - 1}.bmp`, '');
        expect(await storageService.getValidIds()).to.eql({ validIds: [testId - 1, testId] });
        expect(storageServiceSpy.calledOnce).to.equal(true);
        rmSync(`${testPath}/${testId}.bmp`, { recursive: true });
        rmSync(`${testPath}/${testId - 1}.bmp`, { recursive: true });
        rmSync(testPath, { recursive: true });
    });

    const createBaseDirectory = () => {
        if (!existsSync(baseDirectory)) mkdirSync(baseDirectory);
        if (!existsSync(baseDirectory + FILE_TYPE.imageJSON + '/')) mkdirSync(baseDirectory + FILE_TYPE.imageJSON + '/');
        if (!existsSync(baseDirectory + FILE_TYPE.modifiedImage + '/')) mkdirSync(baseDirectory + FILE_TYPE.modifiedImage + '/');
        if (!existsSync(baseDirectory + FILE_TYPE.originalImage + '/')) mkdirSync(baseDirectory + FILE_TYPE.originalImage + '/');
    };
});
