import { Application } from '@app/app';
import { BASE_TEN } from '@common/constants';
import * as http from 'http';
import { AddressInfo } from 'net';
import * as socketIo from 'socket.io';
import { Service } from 'typedi';
import { SocketManager } from './services/socket-manager.service';

@Service()
export class Server {
    private static appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    private server: http.Server;
    private socketManager: SocketManager;

    constructor(private readonly application: Application) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, BASE_TEN) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }
    async init(): Promise<void> {
        this.application.app.set('port', Server.appPort);

        this.server = http.createServer(this.application.app);
        this.socketManager = new SocketManager(
            this.application.waitingRoomHandler,
            this.application.gameRoomHandler,
            this.application.constantsService,
        );
        this.socketManager.sio = new socketIo.Server(this.server);
        this.socketManager.handleSockets();

        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
        try {
            await this.application.databaseService.start();
            // eslint-disable-next-line no-console
            console.log('Database connection successful !');
        } catch {
            // eslint-disable-next-line no-console
            console.error('Database connection failed !');
            process.exit(1);
        }
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * When the server starts up
     */
    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // Because we want to print the port number
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }
}
