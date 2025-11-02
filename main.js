import { program } from 'commander';
import http from 'http';
import fs from 'fs/promises'; 
import path from 'path';

program
  .requiredOption('-h, --host <string>', 'server host')
  .requiredOption('-p, --port <number>', 'server port', parseInt)
  .requiredOption('-c, --cache <string>', 'cache path');

program.parse(process.argv);

const options = program.opts();
const host = options.host;
const port = options.port;
const cache = options.cache;

async function Body(req) {
  const components = [];
  for await (const component of req) {
    components.push(component);
  }
  return Buffer.concat(components);
}

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

  const server = http.createServer(async (req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);

    const httpCode = req.url.slice(1);
    if (!/^\d{3}$/.test(httpCode)) {
      res.writeHead(400); 
      res.end('Invalid HTTP status code in URL.');
      return;
    }

    const filePath = path.join(cache, `${httpCode}.jpeg`);

    switch (req.method) {
      case 'GET':
        try {
          const data = await fs.readFile(filePath);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' }); 
          res.end(data); 
        } catch (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404);
            res.end('Image not found in cache.');
          } else {
            res.writeHead(500);
            res.end('Server Error');
          }
        }
        break;

      case 'PUT':
        try {
          const body = await Body(req); 
          await fs.writeFile(filePath, body);
          res.writeHead(201); 
          res.end('Created/Updated');
        } catch (error) {
          res.writeHead(500);
          res.end('Server Error on write');
        }
        break;

      case 'DELETE':
        try {
          await fs.unlink(filePath);
          res.writeHead(200); 
          res.end('Deleted');
        } catch (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404);
            res.end('Image not found in cache.');
          } else {
            res.writeHead(500);
            res.end('Server Error on delete');
          }
        }
        break;

      default:
        res.writeHead(405); 
        res.end('Method Not Allowed');
        break;
    }
  });

  server.listen(port, host, () => { 
    console.log(`Server started on http://${host}:${port}`);
    console.log(`Cache saved in: ${cache}`);
  });
}

CacheDir().catch(console.error);