import fs from 'fs';
import path from 'path';

const stateFile = path.join(process.cwd(), 'data', 'state.json');

async function getQuote() {
  try {
    const response = await fetch('https://animechan.xyz/api/random');
    const data = await response.json();
    return { quote: data.quote, character: data.character, anime: data.anime };
  } catch (e) {
    return { quote: 'The world isn\'t perfect. But it\'s there for us, doing the best it can.', character: 'Roy Mustang', anime: 'Fullmetal Alchemist' };
  }
}

export default async function handler(req, res) {
  const token = process.env.ADMIN_TOKEN;
  if (req.method === 'POST') {
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    state.fetchQuote = true;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    return res.status(200).json({ success: true });
  }

  const quote = await getQuote();
  res.status(200).json(quote);
}