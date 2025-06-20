import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async (req, res) => {
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
  if (found.times > 0) {
    await codes.updateOne({ code }, { $inc: { times: -1, used: 1 } });
    return res.json({ success: true, times: found.times - 1 });
  }
  return res.status(400).json({ success: false, message: '授权码已用完' });
};