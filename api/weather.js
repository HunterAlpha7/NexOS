export default async function handler(req, res) {
  const lat = 23.777176;  // Dhaka
  const lon = 90.407608;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia/Dhaka`;

  const response = await fetch(url);
  const data = await response.json();

  const currentTemp = data.current_weather.temperature;
  const currentHum = data.hourly.relative_humidity_2m ? data.hourly.relative_humidity_2m[0] : 0;
  const rainProb = data.daily.precipitation_probability_max[0];
  const maxTemp = data.daily.temperature_2m_max[0];
  const minTemp = data.daily.temperature_2m_min[0];
  const code = data.daily.weather_code[0];

  let condition = "Clear";
  const alerts = [];
  if (rainProb > 40) alerts.push("RAIN AHEAD — TAKE UMBRELLA");
  if (maxTemp > 35) alerts.push("TOO HOT — STAY HYDRATED");
  if (maxTemp > 38) alerts.push("EXTREME HEAT ALERT");
  if (minTemp < 15) alerts.push("COLD NIGHT — WEAR JACKET");
  if (code >= 95) alerts.push("THUNDER POSSIBLE — STAY INDOORS");

  if (code === 61 || code === 63) condition = "Rain";
  if (code === 71) condition = "Snow";
  if (code >= 95) condition = "Thunderstorm";

  res.json({
    location: "Dhaka, BD",
    temp: currentTemp.toFixed(1),
    hum: currentHum.toFixed(0),
    condition,
    maxTemp: maxTemp.toFixed(1),
    minTemp: minTemp.toFixed(1),
    rainProb,
    alerts
  });
}