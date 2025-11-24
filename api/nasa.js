export default async function handler(req, res) {
  try {
    const response = await fetch('http://api.open-notify.org/iss-now.json')
    const data = await response.json()
    const lat = data.iss_position ? data.iss_position.latitude : '0'
    const lon = data.iss_position ? data.iss_position.longitude : '0'
    res.json({ name: 'ISS', position: { lat, lon }, message: `ISS position ${lat}, ${lon}` })
  } catch (e) {
    res.json({ name: 'ISS', position: { lat: '0', lon: '0' }, message: 'ISS position unavailable' })
  }
}