const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const parcelRoutes    = require('./routes/parcels');
const dashboardRoutes = require('./routes/dashboard');
const rrRoutes        = require('./routes/rr');

const app = express();
const server = http.createServer(app);

// ── Socket.io with High Resilience ────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Prioritize native WebSocket
  allowUpgrades: true,
  maxHttpBufferSize: 1e8
});

// Make io available to route handlers via req.app.get('io')
app.set('io', io);

// Expose parcels store to R&R routes
const { parcelsMap } = require('./routes/parcels');
app.set('parcelsMap', parcelsMap);

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id} (total online: ${io.engine.clientsCount})`);
  io.emit('clients_count', io.engine.clientsCount);

  socket.on('disconnect', (reason) => {
    console.log(`[WS] Client disconnected: ${socket.id} (reason: ${reason}, remaining: ${io.engine.clientsCount})`);
    io.emit('clients_count', io.engine.clientsCount);
  });
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', message: 'Unified Geo-Aware Land Management Portal API', onlineClients: io.engine.clientsCount })
);
app.use('/api/auth',      authRoutes);
app.use('/api/parcels',   parcelRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rr',        rrRoutes);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server + WebSocket running on port ${PORT}`));
