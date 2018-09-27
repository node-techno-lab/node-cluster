# Crash in promise rejection

To avoid callback hell, we frequently use `Promises`. It is a best practice to use `.catch()` call back at the end of the `.then` chains. 

But if an error is thrown in the `catch` block itself, the error goes nowhere !

What...
* the `Express` response middleware handler is executed successfully 
* the client does not received any error message
* the client receives message sent by the server

But
* when the promise is rejected, an error is thrown in its `cacth` block
* that error does not crash the current execution stack, because of executed in its own little stack, scheduled via event loop. 
* that error goes nowhere 
* the worker process does not crash and continue to serve next coming HTTP requests

> Using the `async/await` does not react on the same way. Because in that cas we use a regular `try/catch block`. If an error os thrown in the catch block .... ToDO

## Update the Worker code

Update the `worker.ts` file like this

In the Promise `.catch()` callback where we send the error HTTP response to the user, the  `undefined` `strg` is accessed that throws an error

```typescript
export class WorkerProcess {
    // ...
    run(): void {
        // ...
        this.app.get('/crash/promise-reject', (req, res, next) => {
            console.log(`${this.workerText} crash with promise rejection...`);
            const strg = undefined;
            Promise.reject('NOK')
                .then((value) => console.log('code not executed !'))
                .catch((err) => res.send(`Promise rejection ${err} ${strg.length}\n`));
            res.send(`${this.workerText} will crashes in promise rejection\n`);
        });
        // ...
    }
}
```

## Test the crash

If you call the `/crash/promise-reject` route by using `curl`

```bash
curl localhost:3030/crash/promise-reject
````

This should produce the following output on the consoles

```text
// Client logs
Worker:57283 will crashes in promise rejection

// Server logs
Worker:57897 Request - GET => /crash/promise-reject
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

* the error thrown in the Promise `.catch()` callback will be catched in the `unhandledRejection` handler
* the worker process will no crashes and not be restarted by the master

## Update the Server code

Update the `server.ts` file like this (because applicable to master and worker processes)

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

## Test global Unhandled Rejection handler

If you compile, restart the application and execute the same curl command `curl localhost:3030/crash/promise-reject`, it should produce the following output on the consoles

```text
// Client logs
Worker:62381 will crashes in promise rejection

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



