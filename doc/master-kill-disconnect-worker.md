# Master Kill/Disconnect workers

In some cases, the master process can decide to stop worker(s) intentionally (E.g. reduced load, ...).  To do this the master can send the `kill` or `disconnect` to the concerned worker.

What...
* The worker process is stopped 
* the master does not refork the worker (see `exitedAfterDisconnect:true`)

## Update the Worker code

Update the `master.ts` file like this

* after 10 sec the master will take the first and second worker in the array of workers it maintains 
* respectively `kill` and `disconnect` the worker
* the worker process is stopped and not restarted by the master (see `exitedAfterDisconnect:true`)

```typescript
export class MasterProcess {
  run(): void {
    // ...
    interval(5000)
      .pipe(take(1))
      .subscribe(async (idx: number) => {
        let worker = this._workers[0];
        console.log(`Master kill worker ${worker.process.pid}...`);
        this._workers[0].kill();

        worker = this._workers[1];
        console.log(`Master disconnect worker ${worker.process.pid}...`);
        worker.disconnect();
      });
    // ...
  }
}
```

## Test the Kill / Disconnect

If you recompile and restart the application, it should produce the following output on the consoles

```text
// Client logs

// Server logs
...
Master kill worker 71598...
Master disconnect worker 71599...
71598 exited after 5.075 sec
71599 exited after 5.07 sec
Worker-71598 stopped working after 5.524 sec (code:null, signal:SIGTERM, exitedAfterDisconnect:true).
Worker-71598 has exit successfully
Master cache contains now 7 cluster worker(s) [71599, 71600, 71601, 71602, 71603, 71604, 71605]
Worker-71599 stopped working after 5.529 sec (code:0, signal:null, exitedAfterDisconnect:true).
Worker-71599 has exit successfully
Master cache contains now 6 cluster worker(s) [71600, 71601, 71602, 71603, 71604, 71605]
```