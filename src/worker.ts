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

        // Apply Log middleware
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
            res.write(`${this.workerText} is responding to the ping...\n`);
            res.end();
        });

        // Crash in the api root flow
        this.app.get('/crash/api-root-flow', (req: express.Request, res: express.Response, next: express.NextFunction): any => {
            const message = `crash in the api root flow...`;
            console.log(message);
            throw new Error(message);
            res.send(message); // Code is unreachable
        });

        // Crash in an async function like setTimeout
        this.app.get('/crash/async', (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const timeout = 1000;
            setTimeout(() => {
                throw new Error(`crash asynchronously in setTimeout()`);
            }, timeout);
            res.send(`${this.workerText} will crash asynchronously in ${timeout} ms\n`);
        });

        // Crash in Promise rejection
        this.app.get('/crash/promise-reject', (req, res, next) => {
            console.log(`${this.workerText} crash with promise rejection...`);
            const strg = undefined;
            Promise.reject('NOK')
                .then((value) => console.log('code not executed !'))
                .catch((err) => res.send(`Promise rejection ${err} ${strg.length}\n`));
            res.send(`${this.workerText} will crashes in promise rejection\n`);
        });

        // Stop the worker process
        this.app.get('/stop', (req, res, next) => {
            setTimeout(() => process.exit(0), 500);
            res.send(`${this.workerText} will stop properly exit(0)...\n`);
        });

        // Exit teh worker process
        this.app.get('/exit', (req, res, next) => {
            setTimeout(() => process.exit(1), 500);
            res.send(`${this.workerText} will exit(1)...\n`);
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
        } catch(err) {
            process.exit(99);
        }
    }
}