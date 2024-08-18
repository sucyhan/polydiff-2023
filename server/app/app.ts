import { HttpException } from '@app/classes/http.exception';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as swaggerJSDoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import { Service } from 'typedi';
import { StorageController } from './controllers/storage.controller';
import { ConstantsService } from './services/constants.service';
import { DatabaseService } from './services/database.service';
import { GameRoomHandler } from './services/game-room-handler.service';
import { GameRoomService } from './services/game-room.service';
import { HistoryService } from './services/history.service';
import { RankingService } from './services/ranking.service';
import { ScoreSortingService } from './services/score-sorting.service';
import { StorageService } from './services/storage.service';
import { UsernameService } from './services/username.service';
import { ValidationService } from './services/validation.service';
import { WaitingRoomHandler } from './services/waiting-room-handler.service';
import { WaitingRoomService } from './services/waiting-room.service';
import { SwaggerDefinitions } from './swagger.definitions';

@Service()
export class Application {
    app: express.Application;
    waitingRoomHandler: WaitingRoomHandler;
    gameRoomHandler: GameRoomHandler;
    readonly storageService: StorageService;
    readonly usernameService: UsernameService;
    readonly waitingRoomService: WaitingRoomService;
    readonly gameRoomService: GameRoomService;
    readonly constantsService: ConstantsService;

    readonly scoreService: ScoreSortingService;
    readonly databaseService: DatabaseService;
    readonly historyService: HistoryService;
    private readonly internalError: number = StatusCodes.INTERNAL_SERVER_ERROR;
    private readonly swaggerOptions: swaggerJSDoc.Options;

    private readonly storageController: StorageController;
    private readonly validationService: ValidationService;
    private readonly rankingService: RankingService;

    private readonly swaggerDefinitions: SwaggerDefinitions;

    constructor() {
        this.app = express();

        this.storageService = new StorageService();
        this.usernameService = new UsernameService();
        this.validationService = new ValidationService();
        this.constantsService = new ConstantsService();
        this.databaseService = new DatabaseService();
        this.rankingService = new RankingService(this.databaseService);
        this.historyService = new HistoryService(this.databaseService);

        this.scoreService = new ScoreSortingService(this.rankingService);
        this.storageController = new StorageController(this.storageService, this.rankingService, this.scoreService);
        this.waitingRoomService = new WaitingRoomService();
        this.gameRoomService = new GameRoomService(this.constantsService);
        this.waitingRoomHandler = new WaitingRoomHandler(this.waitingRoomService, this.usernameService, this.storageService);
        this.gameRoomHandler = new GameRoomHandler(this.gameRoomService, this.validationService, this.scoreService, this.historyService);

        this.swaggerDefinitions = new SwaggerDefinitions();

        this.swaggerOptions = {
            swaggerDefinition: {
                openapi: '3.0.0',
                info: {
                    title: 'Cadriciel Serveur',
                    version: '1.0.0',
                },
            },
            apis: ['**/*.ts'],
        };

        this.config();
        this.bindRoutes();
        this.swaggerDefinitions.setUpDefinitions();
    }

    bindRoutes(): void {
        this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(this.swaggerOptions)));
        this.app.use('/api/storage', this.storageController.router);
        this.app.use('/', (req, res) => {
            res.redirect('/api/docs');
        });
        this.errorHandling();
    }

    private config(): void {
        // Middlewares configuration
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
        this.app.use(cookieParser());
        this.app.use(cors());
    }

    private errorHandling(): void {
        // When previous handlers have not served a request: path wasn't found
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            const err: HttpException = new HttpException('Not Found');
            next(err);
        });

        // development error handler
        // will print stacktrace
        if (this.app.get('env') === 'development') {
            this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
                res.status(err.status || this.internalError);
                res.send({
                    message: err.message,
                    error: err,
                });
            });
        }

        // production error handler
        // no stacktraces  leaked to user (in production env only)
        this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
            res.status(err.status || this.internalError);
            res.send({
                message: err.message,
                error: {},
            });
        });
    }
}
