import { MasterProcess } from './master';
import { WorkerProcess } from './worker';
const cluster = require('cluster');

export class Server {

  constructor(private port: number, private relativePublicPath: string) {
  }

  run(isClusterEnabled: boolean): void {
    Server.registerProcessHooks();

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

  static registerProcessHooks() {
    process.on('uncaughtException', Server.onUncaughtException);
    process.on('unhandledRejection', Server.onUnhandledRejection);
    process.on('exit', () => console.log(`${process.pid} exited after ${process.uptime()} sec`));
  }
  
  static onUnhandledRejection(reason, p) {
    console.error(`${process.pid} - Unhandled rejection occured\r\n` +
      `Promise: ${p}\r\n` +
      `Reason:${reason.message}\r\n${reason.stack}`);
  }

  static onUncaughtException(err) {
     console.error(`${process.pid} - Unhandled exception ocurred\n${err.message}\r\n${err.stack}`);
  }
}
