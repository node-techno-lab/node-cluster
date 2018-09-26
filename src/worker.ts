import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

export class WorkerProcess {

    private app: express.Application = express();
    private workerText: string;

    constructor(private port: number, private relativePublicPath: string) {
        this.app = express();
        this.workerText = `Worker:${process.pid}`;
    }

    run(): void {

//        this.initialize();

        // Apply Log middelware
        this.app.all('*', (req, res, next) => {
            console.log(`${this.workerText} Request - ${req.method} => ${req.url}`);
            next();
        });

        // Serve static files
        this.app.use(cors());
        this.app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }));
        this.app.use('/', express.static(this.relativePublicPath))

        this.app.get('/ping', (req: express.Request, res: express.Response, next: express.NextFunction): any => {
            res.writeHead(200);
            res.write(`${this.workerText} is responding\n`);
            res.end();
        });

        // GET /ping
        this.app.get('/ping', (req: express.Request, res: express.Response, next: express.NextFunction): any => {
            res.writeHead(200);
            res.write(`${this.workerText} is reponding to the ping...\n`);
            res.end();
        });

        // Crash in the api root flow
        this.app.get('/crash/root-flow', (req: express.Request, res: express.Response, next: express.NextFunction): any => {
            const message = `crash in the root flow...`;
            console.log(message);
            throw new Error(message);
            res.send(message); // Code is unreachable
        });

        // Crash in an async function like settimeout
        this.app.get('/crash/async', (rreq: express.Request, res: express.Response, next: express.NextFunction) => {
            const timeout = 1000;
            setTimeout(() => {
                throw new Error(`crash asynchronously in setTimeout()`);
            }, timeout);
            res.send(`${this.workerText} will crash asynchronously in ${timeout} ms\n`);
        });

        // Error handler
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction): any => {
            if (err) {
                console.error(` 500 - ${req.url}\n${err.message}`);
                res.status(500);
                res.send(`${this.workerText} Error ${err.message}\n`);
            }
        });

        // Handle 404
        this.app.all('*', (req: express.Request, res: express.Response) => {
            console.error(`404 - ${req.url}`);
            res.status(404);
            res.end();
        });

        // Create and start the server
        const server = require('http').createServer(this.app);
        server.listen(this.port, (err: any) => {
            if (err) {
                const message = `Listen error ${err}`;
                console.error(message);
                throw new Error(message);
            };
            console.log(`${this.workerText} Web app is listening on port: ${this.port}`);
        });
    }
    private initialize() : void {
        try {
            throw new Error('Unexpected error occurs !');
        } catch(errr) {
            process.exit(99);
        }
    }
}