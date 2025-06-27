// api/analyze.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel Serverless API 默认自动解析 JSON body
  const baziData = req.body;

  // 你的 DeepSeek API Key，建议在 Vercel 项目环境变量中设置 DEEPSEEK_API_KEY
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DeepSeek API key not configured.' });
  }

  // 构建 prompt
  const prompt = `
你是一位精通八字命理的大师。请根据以下信息，为命主进行详细分析。请以JSON格式返回分析结果，只返回JSON对象，不要包含任何额外的解释或非JSON文本。JSON对象应包含以下字段：personality (性格特征), fortune (财运分析), career (事业运势), health (健康状况), marriage (婚姻生活)。

八字信息：
- 性别：${baziData.gender === 'male' ? '男' : '女'}
- 出生地点：${baziData.birthPlace || '未提供'}
- 年柱: ${baziData.yearGan}${baziData.yearZhi}
- 月柱: ${baziData.monthGan}${baziData.monthZhi}
- 日柱: ${baziData.dayGan}${baziData.dayZhi}
- 时柱: ${baziData.hourGan}${baziData.hourZhi}
- 日主: ${baziData.dayMaster}
- 五行力量: ${baziData.fiveElements}
- 喜用神: ${baziData.favorableElements}
- 忌用神: ${baziData.unfavorableElements}

请确保你的分析内容详细、专业，并严格按照JSON格式返回。
`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { "role": "system", "content": "You are a helpful assistant." },
          { "role": "user", "content": prompt }
        ],
        stream: false,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: `DeepSeek API error: ${response.statusText}`, details: errorBody });
    }

    const data = await response.json();
    // DeepSeek 返回的内容是字符串形式的 JSON
    const analysisResult = JSON.parse(data.choices[0].message.content);

    res.status(200).json(analysisResult);

  }   catch (error) {
  console.error('DeepSeek API 调用出错:', error);
  res.status(500).json({
    error: 'Failed to get analysis from DeepSeek.',
    details: error.stack || error.message || error
  });
}
}