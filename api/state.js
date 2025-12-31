import fs from 'fs';
import path from 'path';

const stateFile = path.join(process.cwd(), 'data', 'state.json');

export default function handler(req, res) {
  const token = process.env.DEVICE_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  res.status(200).json(state);

  let stateModified = false;
  // Reset one-time triggers
  if (state.sedentaryAlert) {
    state.sedentaryAlert = false;
    stateModified = true;
  }
  if (state.fetchQuote) {
    state.fetchQuote = false;
    stateModified = true;
  }

  if (stateModified) {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }
}