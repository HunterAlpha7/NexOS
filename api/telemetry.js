import fs from 'fs'
import path from 'path'
const file = path.join(process.cwd(), 'data/telemetry.json')

function ensureFile() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ temp: 0, hum: 0, uptime: 0, lastSeen: null }, null, 2))
}

export default function handler(req, res) {
  ensureFile()
  if (req.method === 'GET') {
    res.json(JSON.parse(fs.readFileSync(file)))
  } else if (req.method === 'POST') {
    const token = process.env.DEVICE_TOKEN
    if (token && req.headers.authorization !== 'Bearer ' + token) { res.status(401).json({ error: 'unauthorized' }); return }
    const body = req.body || {}
    const data = { temp: body.temp || 0, hum: body.hum || 0, uptime: body.uptime || 0, lastSeen: new Date().toISOString() }
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    res.json({ success: true })
  } else {
    res.status(405).end()
  }
}