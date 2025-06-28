export default function handler(req, res) {
  res.json({ key: process.env.DEEPSEEK_API_KEY || 'not set' });
}