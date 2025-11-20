export default async function handler(req, res) {
  const lat = 23.777176;  // Dhaka
  const lon = 90.407608;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia/Dhaka`;

  const response = await fetch(url);
  const data = await response.json();

  const temp = data.current_weather.temperature;
  const maxTemp = data.daily.temperature_2m_max[0];
  const minTemp = data.daily.temperature_2m_min[0];
  const rainProb = data.daily.precipitation_probability_max[0];
  const code = data.daily.weather_code[0];

  let condition = "Clear";
  const alerts = [];

  if (rainProb > 40) alerts.push("RAIN COMING — STAY DRY");
  if (maxTemp > 35) alerts.push("TOO HOT — DRINK WATER");
  if (maxTemp > 38) alerts.push("EXTREME HEAT — AVOID SUN");
  if (minTemp < 15) alerts.push("COLD NIGHT — WEAR JACKET");
  if (code >= 61 && code <= 67) condition = "Rain";
  if (code >= 71 && code <= 77) condition = "Snow (Rare in Dhaka)";
  if (code >= 95) alerts.push("THUNDERSTORM POSSIBLE");

  res.json({
    location: "Dhaka, Bangladesh",
    temp: temp.toFixed(1),
    condition,
    maxTemp: maxTemp.toFixed(1),
    minTemp: minTemp.toFixed(1),
    rainProb,
    alerts
  });
}