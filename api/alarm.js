import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'alarm.json');

function getAlarm() {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { hour: -1, minute: -1, active: false };
  }
}

function saveAlarm(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  const token = process.env.ADMIN_TOKEN;
  if (req.method === 'POST') {
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    saveAlarm(req.body);
    return res.status(200).json({ success: true });
  }

  res.status(200).json(getAlarm());
}