# Crash in  async method

This use case occurs when an error is thrown in code executed out of the current call stack E.g. in a `setTimeout()` callback.

Update the `worker.ts`

```typescript
export class WorkerProcess {
    // ...
    run(): void {
        // ...
       this.app.get('/crash/async', (rreq: express.Request, res: express.Response, next: express.NextFunction) => {
            const timeout = 1000;
            setTimeout(() => {
                throw new Error(`crash asynchronously in setTimeout()`);
            }, timeout);
            res.send(`${this.workerText} will crash asynchronously in ${timeout} ms\n`);
        });
        // ...
    }
}
```

If you run this, 

* the `Express` handler associated with the `/crash/async` route is executed 
* the client does not received any error message and the worker process flow ends up successfully 

* when the `setTimeout()` callback is executed, an error is thrown
* but that error does not crash the current execution stack, because of executed in its own little stack, scheduled via event loop
* but that error completely crashes the worker process
* the master process detects it (`code:1, signal:null, exitedAfterDisconnect:false`) and forks a new worker process. 

This should generate the following output on the console

```text
// Client logs
Worker:37069 will crash asynchronously in 1000 ms

// Server logs
Worker:37069 Request - GET => /crash/async
/Users/id082816/Dev/github/node-techno-lab/node-cluster/dist/worker.js:41
                throw new Error(`crash asynchronously in setTimeout()`);
                ^

Error: crash asynchronously in setTimeout()
    at Timeout.setTimeout [as _onTimeout] (/Users/id082816/Dev/github/node-techno-lab/node-cluster/dist/worker.js:41:23)
    at ontimeout (timers.js:498:11)
    at tryOnTimeout (timers.js:323:5)
    at Timer.listOnTimeout (timers.js:290:5)
Worker-37069 stopped working after 14.427 sec (code:1, signal:null, exitedAfterDisconnect:false).
Master forks a Cluster Worker
Master cache contains now 8 cluster worker(s) [37068, 37070, 37071, 37072, 37073, 37074, 37075, 37125]
Worker-37125 is online...
Worker:37125 Web app is listening on port: 3030
```

## Catching this Uncaught Exception

Because the `settimeout()` error is thrown from another execution stack, scheduled after the `Express` callback function terminates, we cannot just catch this error using the `try/catch` block.

To catch all of these out of band errors, we need to globally register the `uncaughtException` handler where we can log the error message, send the error to a REST endpoint, ....

* the error thrown in the `setTiemout()` callback will be catched in the `uncaughtException` handler
* the worker process will no crashes and not be restarted by the master

Update the `server.ts` (because applicabled to master and worker processes)

```typescript
export class Server {

  run(isClusterEnabled: boolean): void {
    Server.registerProcessHooks();
    // ...
  }

  static registerProcessHooks() {
    process.on('uncaughtException', Server.onUncaughtException);
    process.on('exit', () => console.log(`${process.pid} exited after ${process.uptime()} sec`));
  }

  static onUncaughtException(err) {
     console.error(`${process.pid} - Unhandled exception ocurred\n${err.message}\r\n${err.stack}`);
  }
}
```

If you compile and restart the application, you should see the following output on the console

```text
// Client logs
Worker:37069 will crash asynchronously in 1000 ms

// Server logs
Worker:52099 Request - GET => /crash/async
52099 - Unhandled exception ocurred
crash asynchronously in setTimeout()
Error: crash asynchronously in setTimeout()
    at Timeout.setTimeout [as _onTimeout] (/Users/id082816/Dev/github/node-techno-lab/node-cluster/dist/worker.js:41:23)
    at ontimeout (timers.js:498:11)
    at tryOnTimeout (timers.js:323:5)
    at Timer.listOnTimeout (timers.js:290:5)
```



