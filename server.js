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

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 检查 API 密钥是否设置
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

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// DeepSeek API 调用函数
async function callDeepSeekAPI(prompt) {
    try {
        console.log('准备调用 DeepSeek API...');
        console.log('API URL:', DEEPSEEK_API_URL);
        console.log('API Key:', DEEPSEEK_API_KEY ? '已设置' : '未设置');
        
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
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data || !response.data.choices || !response.data.choices[0]) {
            throw new Error('AI 返回的数据格式不正确');
        }

        console.log('DeepSeek API 调用成功');
        console.log('API 返回内容:', response.data.choices[0].message.content);
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('DeepSeek API 调用错误:', error);
        if (error.response) {
            console.error('API 响应错误:', error.response.status, error.response.data);
            throw new Error(`AI 服务返回错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error('API 请求错误:', error.message);
            throw new Error('无法连接到 AI 服务，请检查网络连接');
        } else {
            console.error('其他错误:', error.message);
            throw new Error('AI 分析服务暂时不可用，请稍后再试');
        }
    }
}

// API 路由
app.post('/api/analyze', async (req, res) => {
    try {
        const { bazi, gender, address } = req.body;
        
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

        const birthMonthConflicts = [];
        if (bazi.monthZhi === currentYearZhi) {
            birthMonthConflicts.push('值太岁');
        }
        if (zhiRelations['刑'][bazi.monthZhi]?.includes(currentYearZhi)) {
            birthMonthConflicts.push('刑太岁');
        }
        if (zhiRelations['冲'][bazi.monthZhi]?.includes(currentYearZhi)) {
            birthMonthConflicts.push('冲太岁');
        }
        if (zhiRelations['破'][bazi.monthZhi]?.includes(currentYearZhi)) {
            birthMonthConflicts.push('破太岁');
        }
        if (zhiRelations['害'][bazi.monthZhi]?.includes(currentYearZhi)) {
            birthMonthConflicts.push('害太岁');
        }

        const birthDayConflicts = [];
        if (bazi.dayZhi === currentYearZhi) {
            birthDayConflicts.push('值太岁');
        }
        if (zhiRelations['刑'][bazi.dayZhi]?.includes(currentYearZhi)) {
            birthDayConflicts.push('刑太岁');
        }
        if (zhiRelations['冲'][bazi.dayZhi]?.includes(currentYearZhi)) {
            birthDayConflicts.push('冲太岁');
        }
        if (zhiRelations['破'][bazi.dayZhi]?.includes(currentYearZhi)) {
            birthDayConflicts.push('破太岁');
        }
        if (zhiRelations['害'][bazi.dayZhi]?.includes(currentYearZhi)) {
            birthDayConflicts.push('害太岁');
        }

        // 构建太岁信息提示词
        const taiSuiInfo = {
            yearTaiSui: birthYearConflicts.length > 0 ? birthYearConflicts.join('、') : '不犯太岁',
            monthTaiSui: birthMonthConflicts.length > 0 ? birthMonthConflicts.join('、') : '不犯太岁',
            dayTaiSui: birthDayConflicts.length > 0 ? birthDayConflicts.join('、') : '不犯太岁'
        };

        const prompt = `请根据以下八字信息进行分析：

八字信息：
- 公历：${bazi.solarDate}
- 农历：${bazi.lunarDate}
- 性别：${gender === 'male' ? '男' : '女'}
- 现居地：${address}
- 八字：${bazi.yearGan}${bazi.yearZhi} ${bazi.monthGan}${bazi.monthZhi} ${bazi.dayGan}${bazi.dayZhi} ${bazi.hourGan}${bazi.hourZhi}
- 日主：${bazi.dayMaster}
- 五行：${bazi.fiveElements}
- 喜用神：${bazi.favorableElements}
- 忌用神：${bazi.unfavorableElements}

太岁信息：
- 年太岁：${taiSuiInfo.yearTaiSui}
- 月太岁：${taiSuiInfo.monthTaiSui}
- 日太岁：${taiSuiInfo.dayTaiSui}

请从以下几个方面进行具体分析（每个方面控制在50字以内），注意：
1. 分析必须符合性别特点（如男性不会出现妇科问题，女性不会出现前列腺问题）
2. 分析要考虑年龄特点：
   - 男性60岁退休，女性55岁退休
   - 退休人员不会建议参加在职培训，年轻人不会建议养生保健
   - 接近退休年龄的人要关注退休规划
3. 分析要考虑身份特点（如学生不会建议职场发展，退休人员不会建议创业）
4. 分析要考虑居住地特点（如南方地区注意湿热，北方地区注意干燥）
5. 建议要具体可行，符合当地实际情况和身份特点
6. 要根据八字计算可能的职业，根据职业来谈事业运
7. 性格要根据天干五行和地支五行来计算
8. 财运、健康也要根据八字计算后再下断语
9. 太岁分析：
   - 年太岁：影响全年运势，主事业、健康、家庭
   - 月太岁：影响当月运势，主财运、人际关系
   - 日太岁：影响当日运势，主具体事务、决策
   - 根据犯太岁程度给出具体化解建议

1. 性格特征：
   - 根据天干五行分析性格特点
   - 根据地支五行分析近期性格表现
   - 需要注意的性格问题

2. 财运分析：
   - 根据八字计算近期财运趋势
   - 根据喜用神分析具体财运机会
   - 根据忌用神分析需要注意的财务风险
   - 如果犯月太岁，要特别注意当月财运波动

3. 事业运势：
   - 根据八字计算适合的职业方向
   - 根据职业特点分析近期发展机遇
   - 根据八字特点分析具体挑战
   - 建议采取的行动
   - 如果犯年太岁，要特别注意全年事业规划

4. 健康状况：
   - 根据八字五行分析近期身体状况
   - 根据五行生克关系分析需要注意的健康问题
   - 根据八字特点建议的保健措施
   - 如果犯年太岁，要特别注意全年健康管理

5. 婚姻生活：
   - 根据八字分析近期感情状况
   - 根据五行生克关系分析具体改善建议
   - 需要注意的问题
   - 如果犯年太岁，要特别注意家庭关系维护

6. 太岁化解建议：
   - 年太岁：
     * 佩戴太岁符化解
     * 佩戴对应生肖饰品
     * 注意方位禁忌
     * 可在家中摆放中宫旺运阵
     * 点灯阵提升运势
   - 月太岁：
     * 建议调整作息时间
     * 注意饮食起居
     * 可在家中对应方位点灯
   - 日太岁：
     * 建议避免重要决策
     * 注意言行举止
     * 可佩戴对应五行饰品

请用具体、明确的语言描述，避免笼统的表述。例如：
- 不要说"财运不错"，而要说"近期有意外收入机会，特别是在下个月"
- 不要说"事业顺利"，而要说"本月有升职机会，建议主动争取"
- 不要说"健康良好"，而要说"近期要注意颈椎问题，建议每天做颈部运动"
- 不要说"犯太岁"，而要说"今年犯年太岁，建议佩戴太岁符和猴形金饰，在家中摆放中宫旺运阵，注意避开寅日"

注意：当前年份是2025年，请确保所有分析都基于2025年的情况。`;

        // 调用 DeepSeek API
        const analysis = await callDeepSeekAPI(prompt);
        console.log('原始分析结果:', analysis);
        
        // 将分析结果分类
        const sections = analysis.split('\n\n');
        console.log('分割后的段落:', sections);
        
        const result = {
            personality: sections.find(s => s.includes('性格'))?.split('：')[1]?.trim() || '暂无分析',
            wealth: sections.find(s => s.includes('财运'))?.split('：')[1]?.trim() || '暂无分析',
            career: sections.find(s => s.includes('事业'))?.split('：')[1]?.trim() || '暂无分析',
            health: sections.find(s => s.includes('健康'))?.split('：')[1]?.trim() || '暂无分析',
            marriage: sections.find(s => s.includes('婚姻'))?.split('：')[1]?.trim() || '暂无分析'
        };

        console.log('处理后的结果:', result);
        res.json(result);
    } catch (error) {
        console.error('分析出错:', error);
        res.status(500).json({ 
            error: error.message || '分析过程中出现错误',
            details: error.stack
        });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`);
}); 