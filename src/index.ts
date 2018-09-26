import * as path from 'path';
import { Server } from './server';

// Define variables (should be set in a configuration)
const port = 3030;
const relativePublicPath = path.join(path.resolve(__dirname, '../public'));

const isClusterEnabled = ((process.argv.length >= 3) && (process.argv[2] === 'false')) ? false : true;

// Create and run the Server
new Server(port, relativePublicPath).run(isClusterEnabled);
