# 部署检查清单

在部署 Watch Room Server 之前，请确保完成以下检查项。

## 📋 部署前检查

### 1. 代码准备

- [ ] 已克隆或下载项目代码
- [ ] 已安装 Node.js 18 或更高版本
- [ ] 已安装 npm 或 yarn
- [ ] 已生成 package-lock.json（运行 `npm install`）
- [ ] 代码已推送到 Git 仓库（如果使用 Git 部署）

### 2. 环境变量配置

- [ ] 已创建 .env 文件（从 .env.example 复制）
- [ ] 已设置 AUTH_KEY（强密码，至少 32 字符）
- [ ] 已设置 ALLOWED_ORIGINS（生产环境使用具体域名）
- [ ] 已设置 PORT（如果需要自定义）
- [ ] 已设置 NODE_ENV=production

### 3. 安全配置

- [ ] AUTH_KEY 使用随机生成的强密码
- [ ] ALLOWED_ORIGINS 不使用 `*`（生产环境）
- [ ] 已准备 SSL 证书（HTTPS）
- [ ] 已配置防火墙规则
- [ ] 已限制服务器访问权限

### 4. 网络配置

- [ ] 已开放服务器端口（默认 3001）
- [ ] 已配置域名解析（如果使用域名）
- [ ] 已配置反向代理（如果使用 Nginx）
- [ ] 已测试网络连通性

## 🚀 部署方式选择

选择一种部署方式并完成相应检查：

### Railway 部署

- [ ] 已注册 Railway 账号
- [ ] 已连接 GitHub 仓库
- [ ] 已设置环境变量
- [ ] 已触发部署
- [ ] 已获取部署 URL

### Fly.io 部署

- [ ] 已安装 Fly CLI
- [ ] 已登录 Fly 账号
- [ ] 已运行 `fly launch`
- [ ] 已设置 secrets（AUTH_KEY, ALLOWED_ORIGINS）
- [ ] 已运行 `fly deploy`
- [ ] 已获取部署 URL

### Docker 部署

- [ ] 已安装 Docker 和 Docker Compose
- [ ] 已配置 .env 文件
- [ ] 已运行 `docker-compose up -d`
- [ ] 已检查容器状态（`docker-compose ps`）
- [ ] 已查看日志（`docker-compose logs`）

### VPS 部署

- [ ] 已连接到 VPS
- [ ] 已安装 Node.js 18+
- [ ] 已安装 PM2
- [ ] 已克隆代码
- [ ] 已运行 `npm install && npm run build`
- [ ] 已配置 .env 文件
- [ ] 已启动服务（`pm2 start dist/index.js`）
- [ ] 已设置开机自启（`pm2 startup && pm2 save`）

## ✅ 部署后验证

### 1. 服务器健康检查

```bash
# 检查健康状态
curl https://your-server.com/health

# 预期响应
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.45
}
```

- [ ] 健康检查返回 200 OK
- [ ] 响应包含正确的 JSON 数据

### 2. 统计信息检查

```bash
# 检查统计信息（需要认证）
curl -H "Authorization: Bearer YOUR_AUTH_KEY" https://your-server.com/stats

# 预期响应
{
  "totalRooms": 0,
  "totalMembers": 0,
  "rooms": []
}
```

- [ ] 统计信息返回 200 OK
- [ ] 认证正常工作

### 3. WebSocket 连接测试

在浏览器控制台运行：

```javascript
const socket = io('https://your-server.com', {
  auth: { token: 'YOUR_AUTH_KEY' },
  extraHeaders: { Authorization: 'Bearer YOUR_AUTH_KEY' }
});

socket.on('connect', () => console.log('✅ Connected'));
socket.on('connect_error', (err) => console.error('❌ Error:', err));
```

- [ ] WebSocket 连接成功
- [ ] 没有认证错误
- [ ] 没有 CORS 错误

### 4. 日志检查

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs watch-room-server

# Railway/Fly.io
# 在控制台查看日志
```

- [ ] 服务器正常启动
- [ ] 没有错误日志
- [ ] 显示正确的配置信息

## 🔗 MoonTVPlus 配置

### 1. Vercel 环境变量

在 Vercel 项目设置中添加：

```env
WATCH_ROOM_ENABLED=true
WATCH_ROOM_SERVER_TYPE=external
WATCH_ROOM_EXTERNAL_SERVER_URL=https://your-server.com
WATCH_ROOM_EXTERNAL_SERVER_AUTH=YOUR_AUTH_KEY
```

- [ ] 已添加所有环境变量
- [ ] URL 正确（包含 https://）
- [ ] AUTH_KEY 与服务器匹配
- [ ] 已重新部署 Vercel 项目

### 2. 功能测试

在 MoonTVPlus 中：

- [ ] 可以创建观影室
- [ ] 可以加入观影室
- [ ] 播放同步正常
- [ ] 聊天功能正常
- [ ] 成员列表正常显示

## 🔒 安全检查

### 1. 认证安全

- [ ] AUTH_KEY 足够强（至少 32 字符）
- [ ] AUTH_KEY 未在代码中硬编码
- [ ] AUTH_KEY 未提交到 Git
- [ ] 定期更换 AUTH_KEY

### 2. 网络安全

- [ ] 使用 HTTPS/WSS
- [ ] ALLOWED_ORIGINS 限制为具体域名
- [ ] 防火墙只开放必要端口
- [ ] 使用反向代理（Nginx）

### 3. 服务器安全

- [ ] 使用非 root 用户运行
- [ ] 定期更新系统和依赖
- [ ] 启用日志记录
- [ ] 设置监控告警

## 📊 监控设置

### 1. 基础监控

- [ ] 设置健康检查监控
- [ ] 设置日志收集
- [ ] 设置错误告警
- [ ] 设置性能监控

### 2. 推荐工具

- [ ] PM2 Plus（进程监控）
- [ ] UptimeRobot（可用性监控）
- [ ] Sentry（错误追踪）
- [ ] Grafana（性能监控）

## 📝 文档记录

- [ ] 记录部署 URL
- [ ] 记录 AUTH_KEY（安全存储）
- [ ] 记录服务器配置
- [ ] 记录部署日期
- [ ] 记录负责人信息

## 🔄 维护计划

### 定期维护

- [ ] 每周检查日志
- [ ] 每月更新依赖
- [ ] 每季度审查安全配置
- [ ] 定期备份配置

### 更新流程

- [ ] 测试环境验证
- [ ] 备份当前版本
- [ ] 执行更新
- [ ] 验证功能
- [ ] 监控运行状态

## 📞 应急联系

记录以下信息以备不时之需：

- 服务器提供商：__________________
- 服务器 IP/域名：__________________
- 管理员账号：__________________
- 紧急联系人：__________________
- 备份位置：__________________

## ✨ 完成确认

全部检查完成后：

- [ ] 所有检查项已完成
- [ ] 服务器运行正常
- [ ] MoonTVPlus 连接成功
- [ ] 功能测试通过
- [ ] 文档已记录
- [ ] 团队已通知

---

**部署日期：** _______________

**部署人员：** _______________

**服务器 URL：** _______________

**备注：** _______________

---

## 🎉 恭喜！

如果所有检查项都已完成，你的 Watch Room Server 已成功部署！

下一步：
1. 通知团队成员
2. 开始使用观影室功能
3. 收集用户反馈
4. 持续优化改进

如有问题，请查看 [故障排查指南](TROUBLESHOOTING.md)。
