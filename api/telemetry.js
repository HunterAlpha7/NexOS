import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'telemetry.json');

function getTelemetry() {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { temp: 0, hum: 0, uptime: 0, lastSeen: null };
  }
}

function saveTelemetry(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  const token = process.env.DEVICE_TOKEN;
  if (req.method === 'POST') {
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const telemetry = getTelemetry();
    const newTelemetry = { ...telemetry, ...req.body, lastSeen: new Date().toISOString() };
    saveTelemetry(newTelemetry);
    return res.status(200).json({ success: true });
  }

  res.status(200).json(getTelemetry());
}