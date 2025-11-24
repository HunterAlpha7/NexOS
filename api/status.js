import fs from 'fs'
import path from 'path'
const telFile = path.join(process.cwd(), 'data/telemetry.json')

export default function handler(req, res) {
  let telemetry = null
  try { telemetry = JSON.parse(fs.readFileSync(telFile)) } catch (e) {}
  const last = telemetry && telemetry.lastSeen ? new Date(telemetry.lastSeen) : null
  const online = last ? (Date.now() - last.getTime() < 30000) : false
  res.json({
    serviceOnline: true,
    deviceOnline: online,
    features: { emo: true, weather: true, quote: true, nasa: true, alarm: true, sedentary: true, ota: true },
    telemetry
  })
}