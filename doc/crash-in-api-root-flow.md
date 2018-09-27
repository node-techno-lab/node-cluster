# Crash in the api root flow

This use case occurs when the worker process `Express` response middleware crashes and throws a Exception

What...
* the code execution flow is aborted
* the worker process continue to run and to serve next incoming HTTP requests
* `Express` returns the detailed HTML of the crash stack to the caller.

## Update worker code

Update the `worker.ts` file like this

* un-comment the call to the `initialize()` that each time throws a fatal error
* add code under the `/crash/api-root-flow` that simulates the crash

```typescript
export class WorkerProcess {
    // ...
    run(): void {
        // this.initialize();

        // ...
        // Crash in the api root flow
        this.app.get('/crash/api-root-flow', (req: express.Request, res: express.Response, next: express.NextFunction): any => {
            const message = `crash in the api root flow...`;
            console.log(message);
            throw new Error(message);
            res.send(message); // Code is unreachable
        });
        // ...
    }
}
```

## Test crash

Call the `/crash/api-root-flow` route, by using `curl` 

```bash
curl localhost:3030/crash/api-root-flow
````

This should produce the following output on the consoles

```text
// Client logs
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Error: crash in the root flow...<br> &nbsp; &nbsp;at app.get (/Users/id082816/Dev/github/node-techno-lab/node-cluster/dist/worker.js:35:19)<br> &nbsp; &nbsp;at Layer.handle [as handle_request] (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/layer.js:95:5)<br> &nbsp; &nbsp;at next (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/route.js:137:13)<br> &nbsp; &nbsp;at Route.dispatch (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/route.js:112:3)<br> &nbsp; &nbsp;at Layer.handle [as handle_request] (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/layer.js:95:5)<br> &nbsp; &nbsp;at /Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/index.js:281:22<br> &nbsp; &nbsp;at Function.process_params (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/index.js:335:12)<br> &nbsp; &nbsp;at next (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/index.js:275:10)<br> &nbsp; &nbsp;at SendStream.error (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/serve-static/index.js:121:7)<br> &nbsp; &nbsp;at emitOne (events.js:116:13)</pre>
</body>
</html>

// Server logs
Worker:26416 Request - GET => /crash/api-root-flow
crash in the root flow...
Error: crash in the api root flow...
    at app.get (/Users/id082816/Dev/github/node-techno-lab/node-cluster/dist/worker.js:35:19)
    at Layer.handle [as handle_request] (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/layer.js:95:5)
    at next (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/layer.js:95:5)
    at /Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/index.js:281:22
    at Function.process_params (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/index.js:335:12)
    at next (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/express/lib/router/index.js:275:10)
    at SendStream.error (/Users/id082816/Dev/github/node-techno-lab/node-cluster/node_modules/serve-static/index.js:121:7)
    at emitOne (events.js:116:13)
```

## Add error handler middelware

To avoid to present the full stack trace to the caller, we can add an extra `Express` error handler middelware that will return a status 500 (Internal Server Error) with the needed info (E.g. error message) 

Update the `worker.ts` like this

```typescript
run(): void {
    // ...
    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction): any => {
        if (err) {
            console.error(` 500 - ${req.url}\n${err.message}`);
            res.status(500);
            res.send(`${this.workerText} Error ${err.message}\n`);
        }
    });

    // Handle 404
    // ...

    // Create and start the server
    // ...
}
```

## Test error handler middleware

If you compile, restart the application and execute the same curl command `curl localhost:3030/crash/api-root-flow`, it should produce the following output on the consoles

```text
// Client logs
Worker:32532 Error crash in the api root flow...

// Server logs
Worker:32532 Request - GET => /crash/api-root-flow
crash in the api root flow...
 500 - /crash/api-root-flow
crash in the api root flow...
```
