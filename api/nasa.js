const NASA_KEY = "V9j1aVMvPivNcAttznmhpanK5xLn8Odrp6BCA2eV";

export default async function handler(req, res) {
  const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?api_key=${NASA_KEY}`);
  const data = await response.json();
  const count = data.element_count;
  res.json({
    message: `NexOS: ${count} near-Earth objects detected today!`,
    count
  });
}