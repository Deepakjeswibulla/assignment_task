import { createServer } from "http";
import next from "next";
import { initSocket } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  initSocket(server);

  server.listen(port, "0.0.0.0", () => {
    console.log(`> SplitShare ready on port ${port}`);
  });
});
