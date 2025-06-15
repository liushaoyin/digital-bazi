import axios from 'axios';
import { Lunar } from 'lunar-javascript';

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

// Vercel Edge Function
export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // CORS 头
    const headers = {
        'Access-Control-Allow-Origin': 'https://liushaoyin.github.io',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    };

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers
        });
    }

    try {
        const { bazi, gender, address } = await req.json();
        if (!bazi || !gender || !address) {
            return new Response(JSON.stringify({
                error: '缺少必要参数',
                details: {
                    bazi: !bazi ? '缺少八字信息' : null,
                    gender: !gender ? '缺少性别信息' : null,
                    address: !address ? '缺少地址信息' : null
                }
            }), {
                status: 400,
                headers
            });
        }

        // 获取当前年份和对应的地支
        const now = new Date();
        const currentYear = now.getFullYear();
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
当前年份：${currentYear}年
本年太岁：${currentYearZhi}
${birthYearConflicts.length > 0 ? `太岁冲突：${birthYearConflicts.join('、')}` : '本年无太岁冲突'}

请从以下几个方面进行分析：
1. 性格特征
2. 财运分析
3. 事业运势
4. 健康状况
5. 婚姻生活

请用简洁明了的语言进行分析，每个方面控制在200字以内。
注意：分析时要考虑当前年份（${currentYear}年）的运势影响。`;

        const analysis = await callDeepSeekAPI(prompt);
        const sections = analysis.split('\n\n');
        const result = {
            personality: sections.find(s => s.includes('性格特征')) || '暂无分析',
            wealth: sections.find(s => s.includes('财运分析')) || '暂无分析',
            career: sections.find(s => s.includes('事业运势')) || '暂无分析',
            health: sections.find(s => s.includes('健康状况')) || '暂无分析',
            marriage: sections.find(s => s.includes('婚姻生活')) || '暂无分析'
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message || '分析过程出现错误',
            details: error.response?.data || null
        }), {
            status: 500,
            headers
        });
    }
} 