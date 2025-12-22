# 🚨 紧急修复：Docker 构建失败

如果你在部署时遇到以下错误：

```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## 快速修复步骤

### 步骤 1: 检查 .gitignore

打开 `.gitignore` 文件，确保 **没有** 这一行：
```
package-lock.json
```

如果有，删除它。

### 步骤 2: 确认 package-lock.json 存在

```bash
ls -la package-lock.json
```

如果文件不存在，运行：
```bash
npm install
```

### 步骤 3: 提交并推送

```bash
git add package-lock.json .gitignore
git commit -m "Fix: Add package-lock.json for Docker builds"
git push
```

### 步骤 4: 重新部署

- **Railway/Render**: 会自动重新部署
- **Fly.io**: 运行 `fly deploy`
- **Docker**: 运行 `docker-compose up -d --build`

## 验证修复

部署成功后，访问：
```bash
curl https://your-server.com/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.45
}
```

## 仍然失败？

查看详细的 [故障排查指南](TROUBLESHOOTING.md)。

---

**为什么会出现这个问题？**

`.gitignore` 文件中包含了 `package-lock.json`，导致这个文件没有被提交到 Git 仓库。当 Docker 构建时，找不到这个文件，`npm ci` 命令就会失败。

**为什么需要 package-lock.json？**

- 确保所有环境使用相同版本的依赖
- `npm ci` 比 `npm install` 更快、更可靠
- 提供可重复的构建结果
