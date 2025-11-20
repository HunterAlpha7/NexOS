import fs from 'fs';
import path from 'path';
const file = path.join(process.cwd(), 'data/alarm.json');

export default function handler(req, res) {
  if (req.method === 'POST') {
    fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } else {
    res.json(JSON.parse(fs.readFileSync(file)));
  }
}