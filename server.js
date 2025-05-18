import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

let io;

const NEXT_PORT = process.env.NEXT_PORT ? Number(process.env.NEXT_PORT) : 3000;
const SOCKET_PORT = process.env.SOCKET_PORT ? Number(process.env.SOCKET_PORT) : 4000;
const NEXT_URL = process.env.NEXT_URL || `http://localhost:${NEXT_PORT}`;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(NEXT_PORT, (err) => {
    if (err) throw err;
    console.log(`> Next.js ready on ${NEXT_URL}`);
  });

  io = new Server(SOCKET_PORT, {
    cors: {
      origin: NEXT_URL,
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
  console.log(`> Socket.IO ready on ${process.env.SOCKET_URL || `http://localhost:${SOCKET_PORT}`}`);
});

// @ts-ignore
export const config = { api: { bodyParser: false } };
