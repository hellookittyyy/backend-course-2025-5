import { program } from 'commander';
import http from 'http';       
import fs from 'fs/promises';   

program
  .requiredOption('-h, --host <string>', 'server host')
  .requiredOption('-p, --port <number>', 'server port', parseInt)
  .requiredOption('-c, --cache <string>', 'cache path');

program.parse(process.argv);

const options = program.opts();
const host = options.host;
const port = options.port;
const cache = options.cache;

async function CacheDir() {
  try {
    await fs.access(cache);
    console.log(`Cache directory "${cache}" already exists.`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Creating cache directory: "${cache}"`);
      await fs.mkdir(cache);
    } else {
      console.error('Error creating cache directory:', error);
      process.exit(1); 
    }
  }

  const server = http.createServer((req) => {
    console.log(`Received request: ${req.method} ${req.url}`);
  });

  server.listen(port, host, () => {
    console.log(`Server started on http://${host}:${port}`);
    console.log(`Cache saved in: ${cache}`);
    });
}

CacheDir().catch(console.error);