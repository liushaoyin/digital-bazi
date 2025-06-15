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

// 检查 API 密钥
if (!process.env.DEEPSEEK_API_KEY) {
    console.error('错误: 未设置 DEEPSEEK_API_KEY 环境变量');
    console.error('请按照以下步骤设置 API 密钥:');
    console.error('1. 在项目根目录创建 .env 文件');
    console.error('2. 在 .env 文件中添加: DEEPSEEK_API_KEY=your_api_key_here');
    console.error('3. 重启服务器');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// 提供静态文件
app.use(express.static(__dirname));

// API 路由
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('收到分析请求:', req.body);
        const { bazi, gender, address } = req.body;
        
        if (!bazi || !gender || !address) {
            console.error('缺少必要参数:', { bazi, gender, address });
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 检查 API 密钥
        if (!process.env.DEEPSEEK_API_KEY) {
            console.error('未设置 DEEPSEEK_API_KEY');
            return res.status(500).json({ 
                error: '服务器配置错误：未设置 API 密钥',
                details: '请确保在 .env 文件中设置了 DEEPSEEK_API_KEY'
            });
        }

        // 验证 API 密钥格式
        if (!process.env.DEEPSEEK_API_KEY.startsWith('sk-')) {
            console.error('API 密钥格式不正确');
            return res.status(500).json({ 
                error: 'API 密钥格式不正确',
                details: 'API 密钥应该以 sk- 开头'
            });
        }

        // 获取当前年份
        const currentYear = new Date().getFullYear();
        const currentYearZhi = getZhiFromYear(currentYear);

        // 检查太岁冲突
        const birthYearConflicts = [];
        if (bazi.yearZhi === currentYearZhi) {
            birthYearConflicts.push('年柱');
        }
        if (bazi.monthZhi === currentYearZhi) {
            birthYearConflicts.push('月柱');
        }
        if (bazi.dayZhi === currentYearZhi) {
            birthYearConflicts.push('日柱');
        }

        // 计算年龄
        const birthDate = new Date(bazi.solarDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        // 根据八字推算退休年龄
        let retirementAge = gender === 'male' ? 60 : 50; // 默认退休年龄
        
        if (gender === 'female') {
            // 女性退休年龄推算逻辑
            const dayMaster = bazi.dayMaster; // 日主
            const favorableElements = bazi.favorableElements.split(' '); // 喜用神
            
            // 如果日主为金或水，且喜用神包含金或水，倾向于55岁退休
            if ((dayMaster === '庚' || dayMaster === '辛' || dayMaster === '壬' || dayMaster === '癸') &&
                (favorableElements.includes('金') || favorableElements.includes('水'))) {
                retirementAge = 55;
            }
            
            // 如果日主为木或火，且喜用神包含木或火，倾向于50岁退休
            if ((dayMaster === '甲' || dayMaster === '乙' || dayMaster === '丙' || dayMaster === '丁') &&
                (favorableElements.includes('木') || favorableElements.includes('火'))) {
                retirementAge = 50;
            }
            
            // 如果日主为土，根据喜用神判断
            if (dayMaster === '戊' || dayMaster === '己') {
                if (favorableElements.includes('金') || favorableElements.includes('水')) {
                    retirementAge = 55;
                } else if (favorableElements.includes('木') || favorableElements.includes('火')) {
                    retirementAge = 50;
                }
            }
        }

        const ageGroup = age < 1 ? '婴儿' : 
                        age < 6 ? '幼儿' :
                        age < 18 ? '少年' :
                        age < 35 ? '青年' :
                        age < retirementAge ? '壮年' : '老年';

        // 构建分析提示
        const prompt = `
请根据以下八字信息进行专业分析：

基本信息：
阳历日期：${bazi.solarDate}
农历日期：${bazi.lunarDate}
性别：${gender}
出生地：${address}
当前年龄：${age}岁
年龄段：${ageGroup}
${age >= retirementAge ? `退休状态：已退休（${gender === 'male' ? '男' : '女'}性${retirementAge}岁退休）` : ''}
${gender === 'female' && age < retirementAge ? `预计退休年龄：${retirementAge}岁（根据八字推算）` : ''}

四柱八字：
年柱：${bazi.yearGan}${bazi.yearZhi}
月柱：${bazi.monthGan}${bazi.monthZhi}
日柱：${bazi.dayGan}${bazi.dayZhi}
时柱：${bazi.hourGan}${bazi.hourZhi}

命理信息：
日主：${bazi.dayMaster}
五行：${bazi.fiveElements}
喜用神：${bazi.favorableElements}
忌用神：${bazi.unfavorableElements}

太岁信息：
当前年份：${currentYear}年
本年太岁：${currentYearZhi}
${birthYearConflicts.length > 0 ? `太岁冲突：${birthYearConflicts.join('、')}` : '本年无太岁冲突'}

请根据年龄段（${ageGroup}）从以下几个方面进行详细分析：

1. 性格特征
- 基本性格特点
- 性格优势与不足
${age >= 3 ? '- 性格对人际关系的影响' : ''}

2. 成长发展
${age < 1 ? `
- 婴儿期（0-1岁）特点
- 近期（3个月内）发展重点
- 父母养育建议` : 
age < 6 ? `
- 幼儿期（1-6岁）特点
- 近期（3个月内）发展重点
- 父母教育建议` :
age < 18 ? `
- 学习能力特点
- 近期（3个月内）学习重点
- 父母教育建议` :
age < 35 ? `
- 事业发展方向
- 近期（3个月内）发展重点
- 职业规划建议` :
age < retirementAge ? `
- 事业发展方向
- 近期（3个月内）发展重点
- 职业规划建议
${gender === 'female' ? `- 退休规划建议（预计${retirementAge}岁退休）` : ''}` : `
- 退休生活规划
- 近期（3个月内）生活重点
- 养生保健建议`}

3. 健康状况
- 体质特点
- 易患疾病
- 养生建议
- 保健方法

4. 太岁影响与化解
- 太岁对运势的影响
${age >= 18 ? '- 太岁与事业运的关系' : ''}
${age >= 18 ? '- 太岁与财运的关系' : ''}
${age >= 18 ? '- 太岁与婚姻运的关系' : ''}
- 化太岁的方法和建议

5. 喜忌神运用
- 喜用神的具体运用方法
- 如何发挥喜用神的积极作用
- 忌用神的规避方法
- 如何化解忌用神的不利影响

6. 近期运势（3个月内）
- 运势特点
- 注意事项
- 开运建议
- 趋吉避凶的方法

请用简洁明了的语言进行分析，每个方面控制在200字以内。
注意：
1. 分析时要考虑当前年份（${currentYear}年）的运势影响
2. 分析内容要符合${ageGroup}年龄段的特点
3. 对于${age < 1 ? '婴儿' : age < 18 ? '未成年人' : '成年人'}，重点关注${age < 1 ? '生长发育和父母养育' : age < 18 ? '学习和成长' : age >= retirementAge ? '退休生活和养生保健' : '事业和生活'}方面的内容
4. 避免分析${age < 18 ? '婚姻、事业、退休' : age < retirementAge ? '退休' : ''}等不相关内容
5. ${age >= retirementAge ? '由于已经退休，分析重点应放在退休生活和养生保健方面，而不是事业发展' : ''}
6. ${gender === 'female' && age < retirementAge ? `根据八字推算，预计${retirementAge}岁退休，分析时请考虑这个时间点` : ''}`;

        console.log('准备调用 DeepSeek API...');
        console.log('API 密钥前6位:', process.env.DEEPSEEK_API_KEY.substring(0, 6) + '...');
        
        // 调用 DeepSeek API
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的命理分析专家，精通八字、五行、太岁等传统命理知识。请根据用户的八字信息进行分析。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('收到 DeepSeek API 响应:', response.status);
        
        if (!response.data || !response.data.choices || !response.data.choices[0]) {
            console.error('API 响应格式错误:', response.data);
            throw new Error('API 响应格式错误');
        }

        const analysis = response.data.choices[0].message.content;
        console.log('分析结果长度:', analysis.length);

        // 解析分析结果
        const sections = analysis.split('\n\n');
        const result = {
            personality: sections.find(s => s.includes('性格特征')) || '暂无分析',
            wealth: sections.find(s => s.includes('财运分析')) || '暂无分析',
            career: sections.find(s => s.includes('事业运势')) || '暂无分析',
            health: sections.find(s => s.includes('健康状况')) || '暂无分析',
            marriage: sections.find(s => s.includes('婚姻生活')) || '暂无分析'
        };

        console.log('处理完成，返回结果');
        res.json(result);
    } catch (error) {
        console.error('分析过程出错:', error);
        if (error.response) {
            console.error('API 错误响应:', {
                status: error.response.status,
                data: error.response.data
            });
            
            if (error.response.status === 401) {
                return res.status(500).json({ error: 'API 密钥无效或已过期，请联系管理员更新。' });
            }
            
            if (error.response.status === 429) {
                return res.status(500).json({ error: 'API 请求次数超限，请稍后再试。' });
            }
            
            if (error.response.data?.error?.includes('Insufficient Balance')) {
                return res.status(500).json({ error: 'AI 分析服务暂时不可用（账户余额不足），请联系管理员充值。' });
            }
        }
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(500).json({ error: '无法连接到 AI 服务，请检查网络连接。' });
        }
        
        if (error.code === 'ETIMEDOUT') {
            return res.status(500).json({ error: 'AI 服务响应超时，请稍后重试。' });
        }
        
        res.status(500).json({ error: '分析过程中出现错误，请稍后重试。' });
    }
});

// 辅助函数：根据年份获取地支
function getZhiFromYear(year) {
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return zhiList[(year - 4) % 12];
}

// 处理所有其他路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器错误' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
}); 