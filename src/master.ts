import { Worker, worker } from 'cluster';
import { interval } from 'rxjs';
import { take, map } from 'rxjs/operators';
const cluster = require('cluster');

export class MasterProcess {

  private _workers: Worker[];

  constructor() {
    this._workers = new Array<Worker>();
  }

  private getMasterText(worker: Worker): string {
    return `Worker-${worker.process.pid}`;
  }

  run(): void {
    console.log(`Running Cluster master ${process.pid}...`);

    const cpuCoreCount = require('os').cpus().length;
    for (let i = 0; i < cpuCoreCount; ++i) {
      this.forkWorker();
      this.displayWorkerCache();
    }

    cluster.on('online', (worker) => {
      console.log(`${this.getMasterText(worker)} is online...`);
    });

    // code <number>   : The exit code, if it exited normally.
    // signal <string> : The name of the signal (e.g. 'SIGHUP') that caused the process to be killed.
    cluster.on('exit', (worker: Worker, code: any, signal: any) => {
      console.error(
        `${this.getMasterText(worker)} stopped working ` +
        `after ${process.uptime()} sec (code:${code}, signal:${signal} exitedAfterDisconnect:${worker.exitedAfterDisconnect}).`);

      const idx = this._workers.indexOf(worker);
      if (idx != -1) {
        this._workers.splice(idx, 1);
      }

      if (code !== 0 && !worker.exitedAfterDisconnect) {
        this.forkWorker();
      } else {
        console.log(`${this.getMasterText(worker)} has exit successfully`)
      }
      this.displayWorkerCache();
    });
  }

  private forkWorker() {
    console.log(`Master forks a Cluster Worker`);
    const worker: Worker = cluster.fork();
    this._workers.push(worker);
  }

  private displayWorkerCache() {
    console.log(
      `Master cache contains now ${this._workers.length} cluster worker(s) ` +
      `[${this._workers.map((w: Worker) => w.process.pid).join(', ')}]`)
  }
}
