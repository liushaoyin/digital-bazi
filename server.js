require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// buildPrompt 函数
function buildPrompt(data) {
    return `
我需要您根据以下提供的个人八字命理信息，为命主进行一次详细、深入、积极向上的性格与运势分析。

**个人信息**:
- **八字**: 年柱(${data.yearGan}${data.yearZhi}), 月柱(${data.monthGan}${data.monthZhi}), 日柱(${data.dayGan}${data.dayZhi}), 时柱(${data.hourGan}${data.hourZhi})
- **日主**: ${data.dayMaster}
- **五行旺衰**: ${data.fiveElements}
- **喜用神**: ${data.favorableElements}
- **忌用神**: ${data.unfavorableElements}
- **性别**: ${data.gender === 'male' ? '男' : '女'}
- **出生地**: ${data.birthPlace}

**分析要求**:
请严格按照以下要求，以JSON格式返回分析结果。JSON对象应包含五个键：'personality', 'wealth', 'career', 'health', 'family'。
每个键对应的值是一个字符串，内容是对相应方面的分析，每个部分的分析字数严格控制在100字以内。

1.  **personality (性格分析)**: 深入剖析命主的核心性格、优点、潜在的挑战，以及如何扬长避短。
2.  **wealth (财运分析)**: 分析命主的财富观、获取财富的方式，并预测未来6-12个月的财运趋势和机遇。
3.  **career (事业分析)**: 分析命主适合的职业方向、事业发展中的贵人运，并预测未来6-12个月的事业走势与挑战。
4.  **health (健康分析)**: 根据命主的五行平衡情况，提醒需要注意的健康问题，并提供保养建议。
5.  **family (家运分析)**: 分析家庭关系、姻缘（如未婚）、子女缘等方面的状况及未来半年的趋势。

请直接返回JSON对象，不要包含任何其他说明或Markdown标记。
`;
}

app.post('/api/analyze', async (req, res) => {
    try {
        const baziData = req.body;
        const deepseekPrompt = buildPrompt(baziData);
        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey || apiKey.includes('your-real-api-key')) {
            return res.status(400).json({ error: 'DeepSeek API 密钥未配置，请检查服务器端的 .env 文件。' });
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { "role": "system", "content": "你是一位精通八字命理和周易解读的国学大师，你的任务是根据用户提供的信息，生成一份结构化的JSON分析报告。" },
                    { "role": "user", "content": deepseekPrompt }
                ],
                stream: false,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('DeepSeek API error:', response.status, errorBody);
            throw new Error(`DeepSeek API returned an error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.choices && result.choices[0]) {
            // 解析AI返回的JSON字符串
            const analysisJson = JSON.parse(result.choices[0].message.content);
            res.json({ analysis: analysisJson });
        } else {
            console.error('Invalid response structure from DeepSeek API:', result);
            throw new Error('从 DeepSeek API 收到了无效的响应结构。');
        }

    } catch (error) {
        console.error('在 /api/analyze 接口中发生错误:', error);
        res.status(500).json({ error: '服务器在分析时发生错误，请稍后再试。' });
    }
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});