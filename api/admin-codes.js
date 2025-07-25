const { MongoClient } = require('mongodb');

// 输出环境变量到 Vercel 日志
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  await client.connect();
  const db = client.db('bazi');
  const codes = db.collection('codes');

  if (req.method === 'GET') {
    const all = await codes.find({}).toArray();
    return res.json(all);
  }

  if (req.method === 'POST') {
    const { code, times, lifetime } = req.body;
    await codes.insertOne({ code, times, lifetime: !!lifetime, used: 0, created: Date.now() });
    return res.json({ success: true });
  }

  res.status(405).end();
};