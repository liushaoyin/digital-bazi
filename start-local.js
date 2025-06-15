const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

// 设置环境变量
process.env.PORT = 3000;
process.env.NODE_ENV = 'development';

// 启动服务器
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
});

// 处理错误
server.on('error', (err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});

// 处理进程退出
process.on('SIGINT', () => {
    server.kill();
    process.exit();
}); 