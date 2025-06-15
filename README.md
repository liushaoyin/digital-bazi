# 数字八字

一个基于八字命理的个人运势分析系统，提供个性分析、运势预测等功能。

## 功能特点

- 支持公历/农历日期输入
- 自动计算四柱八字
- 分析五行喜忌
- 提供太岁信息
- 根据年龄段提供个性化分析
- 支持近期（3个月）运势预测

## 技术栈

- 前端：HTML5, CSS3, JavaScript
- 后端：Node.js, Express
- API：DeepSeek API
- 部署：GitHub Pages

## 本地开发

1. 克隆仓库
```bash
git clone https://github.com/yourusername/digital-bazi.git
cd digital-bazi
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件并添加以下内容：
```
DEEPSEEK_API_KEY=your_api_key_here
```

4. 启动开发服务器
```bash
node start-local.js
```

5. 访问应用
打开浏览器访问 http://localhost:3000

## 部署

1. 构建项目
```bash
npm run build
```

2. 部署到 GitHub Pages
```bash
npm run deploy
```

## 使用说明

1. 输入出生日期（支持公历/农历）
2. 选择出生时辰
3. 选择性别
4. 输入住址
5. 点击"开始测算"按钮
6. 查看分析结果

## 注意事项

- 本系统仅供娱乐参考
- 请勿将 API 密钥泄露给他人
- 建议定期更新 API 密钥

## 联系方式

- 开发者：刘少银
- 电话：15629213139
- QQ：185473360
- 微信：请扫描页面底部的二维码

## 许可证

MIT License 