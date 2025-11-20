const NASA_KEY = "V9j1aVMvPivNcAttznmhpanK5xLn8Odrp6BCA2eV";

export default async function handler(req, res) {
  try {
    const response = await fetch(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${NASA_KEY}&size=1`);
    const data = await response.json();
    const sat = data.near_earth_objects[new Date().toISOString().split('T')[0]][0] || {};
    res.json({
      name: sat.name || "International Space Station",
      velocity: sat.close_approach_data ? sat.close_approach_data[0].relative_velocity.kilometers_per_hour : "28,000 km/h",
      message: `NexOS: ${sat.name || 'ISS'} is orbiting Earth at ${sat.close_approach_data ? sat.close_approach_data[0].relative_velocity.kilometers_per_hour : '28,000'} km/h!`
    });
  } catch (e) {
    res.json({
      name: "ISS",
      velocity: "28,000 km/h",
      message: "NexOS: Space Station above Dhaka right now!"
    });
  }
}