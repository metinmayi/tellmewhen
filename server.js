import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

let io;

const NEXT_PORT = 3000;
const SOCKET_PORT = 4000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(NEXT_PORT, (err) => {
    if (err) throw err;
    console.log(`> Next.js ready on http://localhost:${NEXT_PORT}`);
  });

  io = new Server(SOCKET_PORT, {
    cors: {
      origin: `http://localhost:${NEXT_PORT}`,
      methods: ["GET", "POST"]
    }
  });
  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
    });
    socket.on('availability-update', ({ sessionId }) => {
      io.to(sessionId).emit('refresh-availability');
    });
  });
  console.log(`> Socket.IO ready on http://localhost:${SOCKET_PORT}`);
});

// @ts-ignore
export const config = { api: { bodyParser: false } };
