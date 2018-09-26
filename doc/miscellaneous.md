 # Miscellaneous
 
 ## PM2 ready event
 
You can start PM2 with the `--wait-ready` options and `timeout

```bash
pm2 start index.js --wait-ready --listen-timeout 15000
```

The worker should send the ready event when listening

```typescript
const server = require('http').createServer(this.app);
server.listen(this.port, (err: any) => {
    // ...
    console.log(`${this.workerText} send the ready signal to PM2`);
    if (process.send) {
        process.send('ready');
    }
});
```

## Closing the server properly

The worker process should listen to the `SIGINT`event and close the server properly

```typescript
process.on('SIGINT', () =>{
    console.log(`${this.workerText} closing server properly...`);
    server.close( () => {});
});
```