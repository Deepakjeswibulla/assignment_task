import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocket } from './src/server/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Request error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  initSocket(server);

  server.listen(port, hostname, () => {
    console.log(`> SplitShare ready on http://${hostname}:${port}`);
  });
});
