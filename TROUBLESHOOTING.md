# 故障排查指南

## 常见部署问题

### 1. Docker 构建失败：缺少 package-lock.json

**错误信息：**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**原因：**
- `package-lock.json` 文件在 `.gitignore` 中被忽略
- 文件没有被提交到 Git 仓库

**解决方案：**

**方法 1：移除 .gitignore 中的 package-lock.json（推荐）**

编辑 `.gitignore` 文件，删除或注释掉这一行：
```
# package-lock.json  # 注释掉这行
```

然后提交文件：
```bash
git add package-lock.json .gitignore
git commit -m "Add package-lock.json for reproducible builds"
git push
```

**方法 2：使用 npm install 代替 npm ci**

如果你不想提交 lock 文件，修改 Dockerfile：

```dockerfile
# 将这两行
RUN npm ci
RUN npm ci --omit=dev

# 改为
RUN npm install
RUN npm install --production
```

**注意：** 推荐使用方法 1，因为 `npm ci` 提供更快的安装速度和更好的可重复性。

### 2. 连接失败：Unauthorized

**错误信息：**
```
[WatchRoom] Unauthorized connection attempt
```

**原因：**
- AUTH_KEY 不匹配
- 客户端没有发送正确的认证头

**解决方案：**

1. 检查服务器的 AUTH_KEY 环境变量
2. 检查客户端配置：

```javascript
const socket = io('https://your-server.com', {
  auth: {
    token: 'your-auth-key'  // 必须与服务器的 AUTH_KEY 匹配
  },
  extraHeaders: {
    Authorization: 'Bearer your-auth-key'
  }
});
```

3. 在 MoonTVPlus 的环境变量中确认：
```env
WATCH_ROOM_EXTERNAL_SERVER_AUTH=your-auth-key
```

### 3. CORS 错误

**错误信息：**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解决方案：**

设置 `ALLOWED_ORIGINS` 环境变量：

```env
# 允许所有来源（仅用于测试）
ALLOWED_ORIGINS=*

# 生产环境（推荐）
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 4. WebSocket 连接失败

**错误信息：**
```
WebSocket connection failed
```

**可能原因：**
1. Nginx 没有配置 WebSocket 支持
2. 防火墙阻止了 WebSocket
3. SSL 证书问题

**解决方案：**

#### Nginx 配置

```nginx
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket 超时设置
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

#### 防火墙

确保开放端口：
```bash
# Ubuntu/Debian
sudo ufw allow 3001

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### 5. 服务器无法启动

**错误信息：**
```
Error: AUTH_KEY environment variable is required
```

**解决方案：**

设置必需的环境变量：

```bash
# 方法 1: .env 文件
cp .env.example .env
nano .env

# 方法 2: 直接设置
export AUTH_KEY=your-secret-key
export PORT=3001

# 方法 3: Docker
docker run -e AUTH_KEY=your-key -e PORT=3001 watch-room-server
```

### 6. 构建失败：TypeScript 错误

**错误信息：**
```
error TS2307: Cannot find module 'express'
```

**解决方案：**

确保安装了所有依赖：

```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 构建
npm run build
```

### 7. 端口已被占用

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案：**

#### 方法 1: 更改端口

```env
PORT=3002
```

#### 方法 2: 停止占用端口的进程

```bash
# 查找占用端口的进程
lsof -i :3001

# 或
netstat -tulpn | grep 3001

# 停止进程
kill -9 <PID>
```

### 8. 内存不足

**错误信息：**
```
JavaScript heap out of memory
```

**解决方案：**

增加 Node.js 内存限制：

```bash
# 方法 1: 环境变量
export NODE_OPTIONS="--max-old-space-size=512"

# 方法 2: 修改启动命令
node --max-old-space-size=512 dist/index.js

# 方法 3: PM2
pm2 start dist/index.js --name watch-room-server --node-args="--max-old-space-size=512"
```

### 9. 房间自动删除

**现象：**
房间在房主离开后很快被删除

**说明：**
这是正常的清理机制：
- 房主离线 30 秒：清除播放状态
- 房主离线 5 分钟：删除房间
- 房间无人：立即删除

**如需修改：**

编辑 [src/watch-room-server.ts](src/watch-room-server.ts)：

```typescript
private startCleanupTimer() {
  this.cleanupInterval = setInterval(() => {
    const now = Date.now();
    const deleteTimeout = 10 * 60 * 1000; // 改为 10 分钟
    const clearStateTimeout = 60 * 1000;  // 改为 60 秒
    // ...
  }, 10000);
}
```

### 10. Railway/Render 部署失败

**问题：**
部署时构建超时或失败

**解决方案：**

#### Railway
1. 确保设置了环境变量
2. 检查构建日志
3. 确认 package.json 中的 scripts 正确

#### Render
1. Build Command: `npm install && npm run build`
2. Start Command: `npm start`
3. 设置环境变量
4. 选择正确的 Node.js 版本

### 11. Fly.io 部署问题

**问题：**
健康检查失败

**解决方案：**

检查 [fly.toml](fly.toml) 配置：

```toml
[[services.http_checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "get"
  path = "/health"
  protocol = "http"
```

确保 `/health` 端点正常工作：

```bash
curl https://your-app.fly.dev/health
```

### 12. 日志查看

#### Docker
```bash
docker-compose logs -f
docker logs watch-room-server
```

#### PM2
```bash
pm2 logs watch-room-server
pm2 monit
```

#### Railway
在 Railway 控制台查看 Logs 标签

#### Fly.io
```bash
fly logs
```

## 调试技巧

### 1. 启用详细日志

修改代码添加更多日志：

```typescript
console.log('[DEBUG] Socket connected:', socket.id);
console.log('[DEBUG] Room info:', roomInfo);
```

### 2. 测试连接

使用浏览器控制台测试：

```javascript
const socket = io('https://your-server.com', {
  auth: { token: 'your-key' },
  extraHeaders: { Authorization: 'Bearer your-key' }
});

socket.on('connect', () => console.log('✅ Connected'));
socket.on('connect_error', (err) => console.error('❌ Error:', err));
socket.on('disconnect', () => console.log('⚠️ Disconnected'));
```

### 3. 检查服务器状态

```bash
# 健康检查
curl https://your-server.com/health

# 统计信息（需要认证）
curl -H "Authorization: Bearer your-key" https://your-server.com/stats
```

### 4. 网络诊断

```bash
# 检查端口是否开放
telnet your-server.com 3001

# 或使用 nc
nc -zv your-server.com 3001

# 检查 DNS
nslookup your-server.com

# 检查 SSL
openssl s_client -connect your-server.com:443
```

## 获取帮助

如果以上方法都无法解决问题：

1. 查看完整日志
2. 检查环境变量配置
3. 验证网络连接
4. 提交 Issue 并附上：
   - 错误信息
   - 部署平台
   - 配置文件
   - 日志输出

## 性能优化

### 1. 增加并发能力

使用 PM2 集群模式：

```bash
pm2 start dist/index.js -i max --name watch-room-server
```

### 2. 使用 Redis 适配器

支持多实例负载均衡（需要额外开发）。

### 3. 监控和告警

使用 PM2 Plus 或其他监控工具：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
```

## 安全检查清单

- [ ] AUTH_KEY 使用强密码
- [ ] ALLOWED_ORIGINS 限制为具体域名
- [ ] 使用 HTTPS/WSS
- [ ] 启用防火墙
- [ ] 定期更新依赖
- [ ] 监控异常日志
- [ ] 设置访问限制
- [ ] 备份配置文件
