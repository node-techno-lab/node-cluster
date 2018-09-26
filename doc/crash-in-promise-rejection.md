# Crash in promise rejection

To avoid callback hell, we frequently use `Promises` combined with the usage of the `async/await ` pattern. It is a best practice to use `.catch()` or use a `try/catch` block. 

But if an error is thrown in the catch block itself, the error goes nowhere !

Update the `worker.ts`

In the Promise `cacth` callback where we send the error HTTP response to the user, the  `undefined` `strg` is accessed that throw an error

```typescript
export class WorkerProcess {
    // ...
    run(): void {
        // ...
        this.app.get('/crash/promise-reject', (req, res, next) => {
            console.log(`${this.workerText} crash with promise rejection...`);
            const strg = undefined;
            Promise.reject('NOK')
                .then((value) => console.log('code not exeucted !'))
                .catch((err) => res.send(`Promise rejection ${err} ${strg.length}\n`));
            res.send(`${this.workerText} will crashes in promise rejection\n`);
        });
        // ...
    }
}
```

If you call the `/crash/promise-reject` route by using `curl`

* the `Express` handler associated with the `/crash/promise-reject` route is executed 
* the client does not received any error message and the worker process flow ends up successfully 

* when the promise is rejected, an error is thrown in its `cacth` block
* but that error does not crash the current execution stack, because of executed in its own little stack, scheduled via event loop. 
* That error goes nowhere 
* the worker process does not crash and continue to serve next coming HTTP requests

This should generate the following output on the console

```text
// Client logs
Worker:57283 will crashes in promise rejection

// Server logs
orker:57897 Request - GET => /crash/promise-reject
Worker:57897 crash with promise rejection...
(node:57897) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'length' of undefined
    at Promise.reject.then.catch (/Users/id082816/Dev/github/node-techno-lab/node-cluster/dist/worker.js:50:75)
    at <anonymous>
    at runMicrotasksCallback (internal/process/next_tick.js:122:5)
    at _combinedTickCallback (internal/process/next_tick.js:132:7)
    at process._tickCallback (internal/process/next_tick.js:181:9)
(node:57897) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 2)
(node:57897) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
```

## Catching this Uncaught Exception

To catch all of these out of band errors, we need to globally register the `unhandledRejection` handler where we can log the error message, send the error to a REST endpoint, ....

* the error thrown in the `setTiemout()` callback will be catched in the `uncaughtException` handler
* the worker process will no crashes and not be restarted by the master

Update the `server.ts` (because applicabled to master and worker processes)

```typescript
export class Server {

  constructor(private port: number, private relativePublicPath: string) {
  }

  run(isClusterEnabled: boolean): void {
    Server.registerProcessHooks();
    // ...
  }

  static registerProcessHooks() {
    // ....
    process.on('unhandledRejection', Server.onUnhandledRejection);
  }
  
  static onUnhandledRejection(reason, p) {
    console.error(`${process.pid} - Unhandled rejection occured\r\n` +
      `Promise: ${p}\r\n` +
      `Reason:${reason.message}\r\n${reason.stack}`);
  }
}
```

If you compile and restart the application, you should see the following output on the console

```text
// Client logs
Worker:62381 will crashes in promise rejectio

// Server logs
Worker:62381 Request - GET => /crash/promise-reject
Worker:62381 crash with promise rejection...
62381 - Unhandled rejection occured
Promise: [object Promise]
Reason:Cannot read property 'length' of undefined
TypeError: Cannot read property 'length' of undefined
    at Promise.reject.then.catch (/Users/id082816/Dev/github/node-techno-lab/node-cluster/dist/worker.js:50:75)
    at <anonymous>
    at runMicrotasksCallback (internal/process/next_tick.js:122:5)
    at _combinedTickCallback (internal/process/next_tick.js:132:7)
    at process._tickCallback (internal/process/next_tick.js:181:9)

```



