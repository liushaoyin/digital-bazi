export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { baziData, gender, address } = req.body;

  // 这里写你的八字分析算法，返回分析结果
  const result = {
    personality: "分析结果示例",
    fortune: "分析结果示例",
    career: "分析结果示例",
    health: "分析结果示例",
    marriage: "分析结果示例"
  };

  res.status(200).json(result);
}