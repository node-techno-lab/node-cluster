# Crash in the root flow
 
This use case occurs when 

* an error occurs before the `Express` web application is started listening for HTTP request (E.g. inside the `initialize()` method)
* and you omit to handle the exception

What...
* the worker process crashes
* the master process detects it (`code:1, signal:null, exitedAfterDisconnect:false`) and forks a new worker process (indefinitely)

* But the master should add some logic to avoid to refork the worker indefinitely. E.g. 10 times in a certain amount of time, report a critical error)
* Or the worker should add a `try/catch` block. And if the catch up error is identified as fatal, it exits the worker process with a certain error code (E.g.99) also handled by the master process as a fatal. In that case the master will not refork the worker process
* When the master detect that there is no more worker alive, it must decide to exit itself with a fatal error code. If the maser in controlled by PM2, i will be restarted.

## Update worker code

Update the `worker.ts` file like this

```typescript
export class WorkerProcess {
    // ...
    run(): void {
       this.initialize();
        // ...
    }
    private initialize() : void {
        throw new Error('Unexpected error occurs !');
    }
}
```
## Update master code

Update the `master.ts` file like this

```typescript
 run(): void {
    cluster.on('exit', (worker: Worker, code: any, signal: any) => {
        // ...
      if (code !== 0 && !worker.exitedAfterDisconnect) {
        if (code === 99) {
          console.log(`${this.getMasterText(worker)} reports a fatal error and will not be restarted)`)
        } else {
          this.forkWorker();
        }
      } else {
        console.log(`${this.getMasterText(worker)} has exit successfully`)
      }
      
      if( this._workers.length === O) {
        console.log(`all workers processes have reported fatal errors and cannot be restarted`);
        process.exit(99);
      }
      this.displayWorkerCache();
    });
  }
```

## Test

If you compile and start the application, it should produce the following output on the console

```text
// Server logs
Running Cluster master 22031...
Master forks a Cluster Worker
Master cache contains now 1 cluster worker(s) [22032]
Master forks a Cluster Worker
Master cache contains now 2 cluster worker(s) [22032, 22033]
Master forks a Cluster Worker
Master cache contains now 3 cluster worker(s) [22032, 22033, 22034]
Master forks a Cluster Worker
Master cache contains now 4 cluster worker(s) [22032, 22033, 22034, 22035]
Master forks a Cluster Worker
Master cache contains now 5 cluster worker(s) [22032, 22033, 22034, 22035, 22036]
Master forks a Cluster Worker
Master cache contains now 6 cluster worker(s) [22032, 22033, 22034, 22035, 22036, 22037]
Master forks a Cluster Worker
Master cache contains now 7 cluster worker(s) [22032, 22033, 22034, 22035, 22036, 22037, 22038]
Master forks a Cluster Worker
Master cache contains now 8 cluster worker(s) [22032, 22033, 22034, 22035, 22036, 22037, 22038, 22039]
Worker-22032 is online...
Worker-22033 is online...
Worker-22034 is online...
Worker-22038 is online...
Worker-22036 is online...
Worker-22035 is online...
Worker-22039 is online...
Worker-22037 is online...
Worker-22032 stopped working after 0.448 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22032 reports a fatal error and will not be restarted)
Master cache contains now 7 cluster worker(s) [22033, 22034, 22035, 22036, 22037, 22038, 22039]
Worker-22033 stopped working after 0.459 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22033 reports a fatal error and will not be restarted)
Master cache contains now 6 cluster worker(s) [22034, 22035, 22036, 22037, 22038, 22039]
Worker-22034 stopped working after 0.465 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22034 reports a fatal error and will not be restarted)
Master cache contains now 5 cluster worker(s) [22035, 22036, 22037, 22038, 22039]
Worker-22036 stopped working after 0.483 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22036 reports a fatal error and will not be restarted)
Master cache contains now 4 cluster worker(s) [22035, 22037, 22038, 22039]
Worker-22035 stopped working after 0.483 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22035 reports a fatal error and will not be restarted)
Master cache contains now 3 cluster worker(s) [22037, 22038, 22039]
Worker-22038 stopped working after 0.487 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22038 reports a fatal error and will not be restarted)
Master cache contains now 2 cluster worker(s) [22037, 22039]
Worker-22039 stopped working after 0.496 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22039 reports a fatal error and will not be restarted)
Master cache contains now 1 cluster worker(s) [22037]
Worker-22037 stopped working after 0.502 sec (code:99, signal:null, exitedAfterDisconnect:false).
Worker-22037 reports a fatal error and will not be restarted)
all workers processes have reported fatal errors and cannot be restarted
npm ERR! code ELIFECYCLE
npm ERR! errno 99
npm ERR! node-cluster@0.0.1 start: `npm run build && node ./dist/index.js true`
npm ERR! Exit status 99
npm ERR!
npm ERR! Failed at the node-cluster@0.0.1 start script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/id082816/.npm/_logs/2018-09-26T13_47_46_794Z-debug.log
```