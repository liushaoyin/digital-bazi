#!/bin/bash

# 安装依赖
echo "Installing dependencies..."
npm install

# 构建前端资源
echo "Building frontend resources..."
npm run build

# 使用 PM2 启动应用
echo "Starting application with PM2..."
pm2 start ecosystem.config.js

# 保存 PM2 进程列表
echo "Saving PM2 process list..."
pm2 save

echo "Deployment completed!" 