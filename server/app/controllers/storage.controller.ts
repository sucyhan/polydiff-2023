import { RankingService } from '@app/services/ranking.service';
import { ScoreSortingService } from '@app/services/score-sorting.service';
import { StorageService } from '@app/services/storage.service';
import { FILE_TYPE } from '@common/constants';
import { StorageMessageNewGame, StorageMessageWithIdAndType, StorageMessageWithIdTypeAndData } from '@common/messages';
import { Request, Response, Router, static as expressStatic } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class StorageController {
    router: Router;
    constructor(
        private readonly storageService: StorageService,
        private readonly rankingService: RankingService,
        private readonly scoreService: ScoreSortingService,
    ) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();
        /**
         * @swagger
         * tags:
         *   - name: Storage
         *     description: Storage endpoints
         */

        /**
         * @swagger
         *
         * /api/storage/read:
         *   post:
         *     description: returns the file with the given id
         *     tags:
         *       - Storage
         *     requestBody:
         *         description: StorageMessageWithIdAndType object
         *         required: true
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/StorageMessageWithIdAndType'
         *             example:
         *               id: 0
         *               type: "imageJSON"
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description:
         *           OK
         */
        this.router.post('/read', async (req: Request, res: Response) => {
            const message: StorageMessageWithIdAndType = req.body;
            res.json(await this.storageService.readFile(message.id, message.type));
        });

        /**
         * @swagger
         *
         * /api/storage/modify:
         *   post:
         *     description: returns the file with the given id
         *     tags:
         *       - Storage
         *     requestBody:
         *         description: StorageMessageWithIdTypeAndData object
         *         required: true
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/StorageMessageWithIdTypeAndData'
         *             example:
         *               id: 0
         *               data: "testModify"
         *               type: "imageJSON"
         *     produces:
         *       - application/json
         *     responses:
         *       201:
         *        description:
         *          Created
         */
        this.router.post('/modify', async (req: Request, res: Response) => {
            const message: StorageMessageWithIdTypeAndData = req.body;
            await this.storageService.writeFile(message.id, message.data, message.type);
            res.sendStatus(StatusCodes.CREATED);
        });

        /**
         * @swagger
         *
         * /api/storage/create:
         *   post:
         *     description: returns the file with the given id
         *     tags:
         *       - Storage
         *     requestBody:
         *         description: StorageMessageNewGame object
         *         required: true
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/StorageMessageNewGame'
         *             example:
         *               originalImage: "testCreate"
         *               modifiedImage: "testCreate"
         *               imageJSON: "testCreate"
         *     produces:
         *       - application/json
         *     responses:
         *       201:
         *        description:
         *          Created
         *        schema:
         *           $ref: '#/definitions/StorageMessageWithId'
         */
        this.router.post('/create', async (req: Request, res: Response) => {
            const message: StorageMessageNewGame = req.body;
            const newId = await this.storageService.getNewId();
            const gameJson = JSON.parse(message.imageJSON);
            gameJson.id = newId;
            const originalImageBuffer = Buffer.from(message.originalImageData, 'base64');
            const modifiedImageBuffer = Buffer.from(message.modifiedImageData, 'base64');
            await this.storageService.writeImage(newId, originalImageBuffer, FILE_TYPE.originalImage);
            await this.storageService.writeImage(newId, modifiedImageBuffer, FILE_TYPE.modifiedImage);
            await this.storageService.writeFile(newId, JSON.stringify(gameJson), FILE_TYPE.imageJSON);
            this.rankingService.addGame(newId);
            res.status(StatusCodes.CREATED).json({ id: newId });
        });

        /**
         * @swagger
         *
         * /api/storage/game:
         *   delete:
         *     description: returns the file with the given id
         *     tags:
         *       - Storage
         *     requestBody:
         *         description: StorageMessageWithId object
         *         required: true
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/StorageMessageWithId'
         *             example:
         *               id: 0
         *     produces:
         *       - application/json
         *     responses:
         *       204:
         *        description:
         *          No Content
         */
        this.router.delete('/game', async (req: Request, res: Response) => {
            const id = Number(req.query.id);
            await this.storageService.deleteFile(id, FILE_TYPE.originalImage);
            await this.storageService.deleteFile(id, FILE_TYPE.modifiedImage);
            await this.storageService.deleteFile(id, FILE_TYPE.imageJSON);
            this.rankingService.deleteGame(id);
            res.sendStatus(StatusCodes.NO_CONTENT);
        });

        /**
         * @swagger
         *
         * /api/storage/games:
         *   delete:
         *     description: delete all games
         *     tags:
         *       - Storage
         *     produces:
         *       - application/json
         *     responses:
         *       204:
         *        description:
         *          No Content
         */
        this.router.delete('/games', async (req: Request, res: Response) => {
            await this.storageService.deleteAll();
            await this.rankingService.deleteAllGames();
            res.sendStatus(StatusCodes.NO_CONTENT);
        });

        /**
         * @swagger
         *
         * /api/storage/getValidIds:
         *   get:
         *     description: returns the file with the given id
         *     tags:
         *       - Storage
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description:
         *           OK
         *         schema:
         *           $ref: '#/definitions/ValidIdsMessage'
         */
        this.router.get('/getValidIds', async (req: Request, res: Response) => {
            res.status(StatusCodes.OK).json(await this.storageService.getValidIds());
        });

        /**
         * @swagger
         *
         * /api/storage/score:
         *   post:
         *     description: returns the file with the given id
         *     tags:
         *       - Storage
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description:
         *           OK
         *         schema:
         *           $ref: '#/definitions/UsersScore[]'
         */
        this.router.post('/score', async (req: Request, res: Response) => {
            res.status(StatusCodes.OK).json(await this.scoreService.getScores(Number.parseInt(req.body.id, 10), req.body.gamePlayerMode));
        });

        /**
         * @swagger
         *
         * /api/storage/originalImage:
         *   use:
         *     description: makes the images in the originalImage folder available
         *     tags:
         *       - Storage
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description:
         *           OK
         */
        this.router.use('/originalImage', expressStatic('data/originalImage'));

        /**
         * @swagger
         *
         * /api/storage/modifiedImage:
         *   use:
         *     description: makes the images in the originalImage folder available
         *     tags:
         *       - Storage
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description:
         *           OK
         */
        this.router.use('/modifiedImage', expressStatic('data/modifiedImage'));
    }
}
