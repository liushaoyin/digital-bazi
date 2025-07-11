const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isDevelopment
  ? "http://localhost:3000/api/analyze" // 开发环境
  : "/api/analyze"; // 生产环境

// 开发环境配置
const DEV_CONFIG = {
    port: 8081,
    apiPort: 3000
};
