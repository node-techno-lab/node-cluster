import { MasterProcess } from './master';
import { WorkerProcess } from './worker';
const cluster = require('cluster');

export class Server {

  constructor(private port: number, private relativePublicPath: string) {
  }

  run(isClusterEnabled: boolean): void {
    if (isClusterEnabled) {
      if (cluster.isMaster) {
        new MasterProcess().run();
      }
      else {
        new WorkerProcess(this.port, this.relativePublicPath).run();
      }
    } else {
      new WorkerProcess(this.port, this.relativePublicPath).run();
    }
  }
}
