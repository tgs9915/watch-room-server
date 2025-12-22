import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { WatchRoomServer } from './watch-room-server.js';

// 加载环境变量
dotenv.config();

const app = express();
const httpServer = createServer(app);

// 配置
const PORT = parseInt(process.env.PORT || '3001', 10);
const AUTH_KEY = process.env.AUTH_KEY || '';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
const NODE_ENV = process.env.NODE_ENV || 'development';

// 验证必需的环境变量
if (!AUTH_KEY) {
  console.error('Error: AUTH_KEY environment variable is required');
  process.exit(1);
}

// 中间件
app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 统计信息端点（需要认证）
app.get('/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${AUTH_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const stats = watchRoomServer.getStats();
  return res.json(stats);
});

// 根路径
app.get('/', (_req, res) => {
  res.json({
    name: 'Watch Room Server',
    version: '1.0.0',
    description: 'Standalone watch room server for MoonTVPlus',
    endpoints: {
      health: '/health',
      stats: '/stats (requires auth)',
      socket: '/socket.io',
    },
  });
});

// Socket.IO 配置
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  // 鉴权中间件
  allowRequest: (req, callback) => {
    // 详细日志
    console.log('[WatchRoom] Connection attempt from:', req.headers.origin);
    console.log('[WatchRoom] URL:', req.url);

    // 尝试从多个地方获取认证信息
    const authHeader = req.headers.authorization;
    const urlParams = new URL(req.url || '', 'http://localhost').searchParams;
    const authFromQuery = urlParams.get('auth');

    console.log('[WatchRoom] Authorization header:', authHeader);
    console.log('[WatchRoom] Auth from query:', authFromQuery);
    console.log('[WatchRoom] Expected AUTH_KEY:', AUTH_KEY);

    // 检查 Authorization header
    if (authHeader === `Bearer ${AUTH_KEY}`) {
      console.log('[WatchRoom] ✅ Authentication successful (via header)');
      callback(null, true);
      return;
    }

    // 检查 query 参数（作为备用方案）
    if (authFromQuery === AUTH_KEY) {
      console.log('[WatchRoom] ✅ Authentication successful (via query)');
      callback(null, true);
      return;
    }

    console.log('[WatchRoom] ❌ Authentication failed');
    console.log('[WatchRoom] Received header:', authHeader);
    console.log('[WatchRoom] Received query:', authFromQuery);
    console.log('[WatchRoom] Expected:', `Bearer ${AUTH_KEY}`);
    callback('Unauthorized', false);
  },
});

// 初始化观影室服务器
const watchRoomServer = new WatchRoomServer(io);

// 启动服务器
httpServer.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🎬 Watch Room Server Started');
  console.log('='.repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log(`Auth Key: ${AUTH_KEY.substring(0, 8)}...`);
  console.log(`Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log('='.repeat(60));
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Stats: http://localhost:${PORT}/stats`);
  console.log(`Socket.IO: ws://localhost:${PORT}/socket.io`);
  console.log('='.repeat(60));
});

// 优雅关闭
const shutdown = (signal: string) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);

  watchRoomServer.destroy();

  httpServer.close(() => {
    console.log('[WatchRoom] HTTP server closed');
    process.exit(0);
  });

  // 强制退出超时
  setTimeout(() => {
    console.error('[WatchRoom] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('[WatchRoom] Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[WatchRoom] Unhandled Rejection at:', promise, 'reason:', reason);
});
