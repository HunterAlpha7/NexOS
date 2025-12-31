import fs from 'fs';
import path from 'path';

const telemetryFile = path.join(process.cwd(), 'data', 'telemetry.json');

export default function handler(req, res) {
  let telemetry = {};
  try {
    telemetry = JSON.parse(fs.readFileSync(telemetryFile, 'utf8'));
  } catch (e) {}

  const isOnline = telemetry.lastSeen && (new Date() - new Date(telemetry.lastSeen) < 30000);

  res.status(200).json({
    deviceOnline: isOnline,
    telemetry: telemetry,
  });
}