const axios = require('axios');
const { Lunar } = require('lunar-javascript');

// 地支关系判断
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

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// DeepSeek API 调用函数
async function callDeepSeekAPI(prompt) {
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
        timeout: 30000
    });
    return response.data.choices[0].message.content;
}

// Vercel Serverless Function
module.exports = async (req, res) => {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', 'https://liushaoyin.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
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
        const now = new Date();
        const currentLunar = Lunar.fromDate(now);
        const currentYearZhi = currentLunar.getYearZhi();
        const birthYearConflicts = [];
        if (bazi.yearZhi === currentYearZhi) birthYearConflicts.push('值太岁');
        if (zhiRelations['刑'][bazi.yearZhi]?.includes(currentYearZhi)) birthYearConflicts.push('刑太岁');
        if (zhiRelations['冲'][bazi.yearZhi]?.includes(currentYearZhi)) birthYearConflicts.push('冲太岁');
        if (zhiRelations['破'][bazi.yearZhi]?.includes(currentYearZhi)) birthYearConflicts.push('破太岁');
        if (zhiRelations['害'][bazi.yearZhi]?.includes(currentYearZhi)) birthYearConflicts.push('害太岁');
        const prompt = `\n请根据以下八字信息进行分析：\n\n阳历日期：${bazi.solarDate}\n农历日期：${bazi.lunarDate}\n性别：${gender}\n出生地：${address}\n\n八字信息：\n年柱：${bazi.yearGan}${bazi.yearZhi}\n月柱：${bazi.monthGan}${bazi.monthZhi}\n日柱：${bazi.dayGan}${bazi.dayZhi}\n时柱：${bazi.hourGan}${bazi.hourZhi}\n\n日主：${bazi.dayMaster}\n五行：${bazi.fiveElements}\n喜用神：${bazi.favorableElements}\n\n太岁信息：\n${birthYearConflicts.length > 0 ? `本年太岁：${currentYearZhi}\n太岁冲突：${birthYearConflicts.join('、')}` : '本年无太岁冲突'}\n\n请从以下几个方面进行分析：\n1. 性格特征\n2. 财运分析\n3. 事业运势\n4. 健康状况\n5. 婚姻生活\n\n请用简洁明了的语言进行分析，每个方面控制在200字以内。`;
        const analysis = await callDeepSeekAPI(prompt);
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
        res.status(500).json({
            error: error.message || '分析过程出现错误',
            details: error.response?.data || null
        });
    }
}; 