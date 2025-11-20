export default function handler(req, res) {
  res.json({
    online: true,
    uptime: process.uptime(),
    lastSeen: new Date().toISOString(),
    features: { emo: true, weather: true, quote: true, nasa: true, alarm: true, sedentary: true }
  });
}