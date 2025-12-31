import fs from 'fs';
import path from 'path';

const stateFile = path.join(process.cwd(), 'data', 'state.json');

export default function handler(req, res) {
  const token = process.env.ADMIN_TOKEN;
  if (req.method === 'POST') {
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    state.sedentaryAlert = true;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    return res.status(200).json({ success: true });
  }

  res.status(405).end(); // Method Not Allowed
}