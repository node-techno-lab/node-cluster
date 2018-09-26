
# Worker Stop/Exit by itself

Update the `worker.ts`

* add code under the `/stop` that calls `process.exit(0)` after 500 ms (in `setTimeout()`callback)
* add code under the `/exit` that calls `process.exit(1)` after 500 ms (in `setTimeout()`callback)


`
```typescript
export class WorkerProcess {
    // ...
    run(): void {
        // ...
        this.app.get('/stop', (req, res, next) => {
            setTimeout(() => process.exit(0), 500);
            res.send(`${this.workerText} will stop properly exit(0)...\n`);
        });
        this.app.get('/exit', (req, res, next) => {
            setTimeout(() => process.exit(1), 500);
            res.send(`${this.workerText} will exit(1)...\n`);
        });        
        // ...
    }
}
```

## Test the /stop

If you call the `/stop` route by using `curl`

```
curl localhost:3030/crash/stop
```

* the worker process stops and return the code=0 to the master
* the master does not restart it

If you call the `/exit` route by using `curl`

```text
// Client logs
Worker:67636 will stop properly exit(0)...

// Server logs
Worker:67636 Request - GET => /stop
67636 exited after 3.942 sec
Worker-67636 stopped working after 4.138 sec (code:0, signal:null, exitedAfterDisconnect:false).
Worker-67636 has exit successfully
Master cache contains now 7 cluster worker(s) [67637, 67638, 67639, 67640, 67641, 67642, 67643]
```

## Test the  /exit
If you call the `/exit` route by using `curl`

```
curl localhost:3030/crash/exit
```

* the worker process exits with an error code (<> zero)
* the master for a new worker

If you call the `/exit` route by using `curl`

```text
// Client logs
Worker:68397 will exit(1)...

// Server logs
Worker:68397 Request - GET => /exit
68397 exited after 7.913 sec
Worker-68397 stopped working after 8.075 sec (code:1, signal:null, exitedAfterDisconnect:false).
Master forks a Cluster Worker
Master cache contains now 8 cluster worker(s) [68398, 68399, 68400, 68401, 68402, 68403, 68404, 68430]
Worker-68430 is online...
Worker:68430 Web app is listening on port: 3030
```