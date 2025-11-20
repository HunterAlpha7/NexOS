export default async function handler(req, res) {
  try {
    const response = await fetch('https://animechan.xyz/api/random');
    const data = await response.json();
    res.json({
      quote: data.quote,
      character: data.character,
      anime: data.anime
    });
  } catch (e) {
    res.json({
      quote: "Believe in yourself!",
      character: "Naruto Uzumaki",
      anime: "Naruto"
    });
  }
}