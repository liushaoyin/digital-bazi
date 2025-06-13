require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { Lunar } = require('lunar-javascript');

// 添加调试信息
console.log('当前工作目录:', process.cwd());
console.log('.env 文件路径:', path.resolve(process.cwd(), '.env'));
console.log('环境变量 DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置');

const app = express();
const port = process.env.PORT || 3000;

// 配置 CORS
const corsOptions = {
    origin: ['https://liushaoyin.github.io', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json());

// 静态文件服务 - 提供当前目录下的所有静态文件
app.use('/', express.static(__dirname));

// 根路由处理
app.get('/', (req, res) => {
    try {
        const indexPath = path.join(__dirname, 'index.html');
        console.log('Serving index.html from:', indexPath);
        res.sendFile(indexPath);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error serving index.html');
    }
});

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 检查 API 密钥
if (!DEEPSEEK_API_KEY) {
    console.error('错误：未设置 DEEPSEEK_API_KEY 环境变量');
    process.exit(1);
}

// 添加地支关系判断
const zhiRelations = {
    // 刑
    '刑': {
        '子': ['卯'], '卯': ['子'],
        '寅': ['巳', '申'], '巳': ['寅', '申'], '申': ['寅', '巳'],
        '辰': ['辰'], '午': ['午'],
        '未': ['未'], '酉': ['酉'],
        '戌': ['戌'], '亥': ['亥']
    },
    // 冲
    '冲': {
        '子': ['午'], '午': ['子'],
        '丑': ['未'], '未': ['丑'],
        '寅': ['申'], '申': ['寅'],
        '卯': ['酉'], '酉': ['卯'],
        '辰': ['戌'], '戌': ['辰'],
        '巳': ['亥'], '亥': ['巳']
    },
    // 破
    '破': {
        '子': ['酉'], '酉': ['子'],
        '丑': ['戌'], '戌': ['丑'],
        '寅': ['亥'], '亥': ['寅'],
        '卯': ['子'], '子': ['卯'],
        '辰': ['丑'], '丑': ['辰'],
        '巳': ['申'], '申': ['巳'],
        '午': ['卯'], '卯': ['午'],
        '未': ['辰'], '辰': ['未'],
        '酉': ['午'], '午': ['酉'],
        '戌': ['未'], '未': ['戌'],
        '亥': ['申'], '申': ['亥']
    },
    // 害
    '害': {
        '子': ['未'], '未': ['子'],
        '丑': ['午'], '午': ['丑'],
        '寅': ['巳'], '巳': ['寅'],
        '卯': ['辰'], '辰': ['卯'],
        '申': ['亥'], '亥': ['申'],
        '酉': ['戌'], '戌': ['酉']
    }
};

// DeepSeek API 调用函数
async function callDeepSeekAPI(prompt) {
    try {
        console.log('准备调用 DeepSeek API...');
        console.log('API URL:', DEEPSEEK_API_URL);
        console.log('API Key 前6位:', DEEPSEEK_API_KEY.substring(0, 6) + '...');

        const response = await axios.post(DEEPSEEK_API_URL, {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "你是一个专业的命理分析专家，精通八字、五行、太岁等传统命理知识。请根据用户的八字信息进行分析。"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30秒超时
        });

        if (!response.data || !response.data.choices || !response.data.choices[0]) {
            console.error('API 返回数据格式不正确:', response.data);
            throw new Error('AI 返回的数据格式不正确');
        }

        console.log('DeepSeek API 调用成功');
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('DeepSeek API 调用错误:', error);
        
        if (error.response) {
            console.error('API 响应错误:', {
                status: error.response.status,
                data: error.response.data
            });
            
            if (error.response.status === 401) {
                throw new Error('API 密钥无效或已过期');
            } else if (error.response.status === 429) {
                throw new Error('API 调用次数超限，请稍后再试');
            } else if (error.response.data?.error?.message?.includes('insufficient_quota')) {
                throw new Error('AI 服务账户余额不足，请联系管理员充值');
            }
            
            throw new Error(`AI 服务返回错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error('API 请求错误:', error.message);
            throw new Error('无法连接到 AI 服务，请检查网络连接');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('请求超时，请稍后重试');
        } else {
            console.error('其他错误:', error.message);
            throw new Error('AI 分析服务暂时不可用，请稍后再试');
        }
    }
}

// API 路由
app.post('/api/analyze', async (req, res) => {
    // 设置 CORS 头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { bazi, gender, address } = req.body;
        
        if (!bazi || !gender || !address) {
            return res.status(400).json({
                error: '缺少必要参数',
                details: {
                    bazi: !bazi ? '缺少八字信息' : null,
                    gender: !gender ? '缺少性别信息' : null,
                    address: !address ? '缺少地址信息' : null
                }
            });
        }

        // 获取太岁信息
        const now = new Date();
        const currentLunar = Lunar.fromDate(now);
        const currentYearZhi = currentLunar.getYearZhi();
        
        // 计算太岁冲突
        const birthYearConflicts = [];
        if (bazi.yearZhi === currentYearZhi) {
            birthYearConflicts.push('值太岁');
        }
        if (zhiRelations['刑'][bazi.yearZhi]?.includes(currentYearZhi)) {
            birthYearConflicts.push('刑太岁');
        }
        if (zhiRelations['冲'][bazi.yearZhi]?.includes(currentYearZhi)) {
            birthYearConflicts.push('冲太岁');
        }
        if (zhiRelations['破'][bazi.yearZhi]?.includes(currentYearZhi)) {
            birthYearConflicts.push('破太岁');
        }
        if (zhiRelations['害'][bazi.yearZhi]?.includes(currentYearZhi)) {
            birthYearConflicts.push('害太岁');
        }

        // 构建分析提示
        const prompt = `
请根据以下八字信息进行分析：

阳历日期：${bazi.solarDate}
农历日期：${bazi.lunarDate}
性别：${gender}
出生地：${address}

八字信息：
年柱：${bazi.yearGan}${bazi.yearZhi}
月柱：${bazi.monthGan}${bazi.monthZhi}
日柱：${bazi.dayGan}${bazi.dayZhi}
时柱：${bazi.hourGan}${bazi.hourZhi}

日主：${bazi.dayMaster}
五行：${bazi.fiveElements}
喜用神：${bazi.favorableElements}

太岁信息：
${birthYearConflicts.length > 0 ? `本年太岁：${currentYearZhi}\n太岁冲突：${birthYearConflicts.join('、')}` : '本年无太岁冲突'}

请从以下几个方面进行分析：
1. 性格特征
2. 财运分析
3. 事业运势
4. 健康状况
5. 婚姻生活

请用简洁明了的语言进行分析，每个方面控制在200字以内。`;

        console.log('发送到 DeepSeek 的提示:', prompt);

        const analysis = await callDeepSeekAPI(prompt);
        
        // 解析分析结果
        const sections = analysis.split('\n\n');
        const result = {
            personality: sections.find(s => s.includes('性格特征')) || '暂无分析',
            wealth: sections.find(s => s.includes('财运分析')) || '暂无分析',
            career: sections.find(s => s.includes('事业运势')) || '暂无分析',
            health: sections.find(s => s.includes('健康状况')) || '暂无分析',
            marriage: sections.find(s => s.includes('婚姻生活')) || '暂无分析'
        };

        res.json(result);
    } catch (error) {
        console.error('分析过程出错:', error);
        res.status(500).json({
            error: error.message || '分析过程出现错误',
            details: error.response?.data || null
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 404 处理
app.use((req, res) => {
    console.log('404 - 未找到页面:', req.url);
    res.status(404).send('页面未找到');
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running at https://digital-bazi.vercel.app`);
    console.log('Current directory:', __dirname);
    console.log('index.html path:', path.join(__dirname, 'index.html'));
}); 