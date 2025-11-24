import fs from 'fs'
import path from 'path'
const file = path.join(process.cwd(), 'data/state.json')

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.json(JSON.parse(fs.readFileSync(file)))
  } else if (req.method === 'POST') {
    const token = process.env.ADMIN_TOKEN
    if (token && req.headers.authorization !== 'Bearer ' + token) { res.status(401).json({ error: 'unauthorized' }); return }
    const state = JSON.parse(fs.readFileSync(file))
    const body = req.body || {}
    Object.assign(state, body)
    fs.writeFileSync(file, JSON.stringify(state, null, 2))
    res.json({ success: true })
  } else {
    res.status(405).end()
  }
}