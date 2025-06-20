const fs = require('fs');
const path = require('path');

// 检查必要的文件是否存在
const requiredFiles = [
    'index.html',
    'script.js',
    'styles.css',
    'config.js'
];

console.log('开始部署检查...\n');

// 检查文件
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} 存在`);
    } else {
        console.error(`❌ ${file} 不存在`);
        process.exit(1);
    }
});

// 检查 config.js 中的 API URL
const configContent = fs.readFileSync('config.js', 'utf8');
if (configContent.includes('API_URL')) {
    console.log('✅ config.js 包含 API_URL 配置');
} else {
    console.error('❌ config.js 缺少 API_URL 配置');
    process.exit(1);
}

// 检查 index.html 中的脚本引用
const htmlContent = fs.readFileSync('index.html', 'utf8');
if (htmlContent.includes('config.js') && htmlContent.includes('script.js')) {
    console.log('✅ index.html 正确引用了必要的脚本');
} else {
    console.error('❌ index.html 缺少必要的脚本引用');
    process.exit(1);
}

console.log('\n部署检查完成！如果以上检查都通过，可以执行以下命令部署：');
console.log('git add .');
console.log('git commit -m "你的提交信息"');
console.log('git push origin gh-pages'); 