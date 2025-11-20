import fs from 'fs';
import path from 'path';
const file = path.join(process.cwd(), 'data/state.json');

export default function handler(req, res) {
  const state = JSON.parse(fs.readFileSync(file));
  if (req.method === 'POST') {
    state.sedentaryAlert = true;
    fs.writeFileSync(file, JSON.stringify(state, null, 2));
    res.json({ success: true });
  } else {
    res.json(state);
  }
}