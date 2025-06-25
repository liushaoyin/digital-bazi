const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;
  await client.connect();
  const db = client.db('bazi');
  const codes = db.collection('codes');
  const found = await codes.findOne({ code });
  if (!found) return res.status(400).json({ success: false, message: '授权码无效' });

  if (found.lifetime) {
    return res.json({ success: true, lifetime: true });
  }

  // 你可以根据实际需求补充更多逻辑
  return res.json({ success: true, lifetime: false });
};