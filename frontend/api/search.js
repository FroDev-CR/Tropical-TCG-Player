// api/search.js - Vercel serverless function para proxy de APIs
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tcgType, searchTerm, page = 1, limit = 24 } = req.query;

  if (!tcgType || !searchTerm) {
    return res.status(400).json({ error: 'Missing tcgType or searchTerm' });
  }

  try {
    // TCGS API - ahora incluye Pokemon también
    const endpoints = {
      pokemon: '/pokemon/cards',
      onepiece: '/one-piece/cards',
      dragonball: '/dragon-ball-fusion/cards',
      digimon: '/digimon/cards',
      magic: '/magic/cards',
      unionarena: '/union-arena/cards',
      gundam: '/gundam/cards'
    };

    const endpoint = endpoints[tcgType];
    if (!endpoint) {
      return res.status(400).json({ error: 'Invalid TCG type' });
    }

    const apiUrl = `https://apitcg.com/api${endpoint}?name=${encodeURIComponent(searchTerm)}&limit=${limit}&page=${page}`;
    const headers = {};
    
    if (process.env.TCGS_API_KEY) {
      headers['x-api-key'] = process.env.TCGS_API_KEY;
    }

    console.log(`🔍 Proxy request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Normalize response format - todas las respuestas son de TCGS API
    const cards = (data.data || data.cards || []).map(card => ({
      ...card,
      tcgType: tcgType
    }));

    res.status(200).json({
      success: true,
      cards: cards,
      totalResults: cards.length,
      page: parseInt(page),
      tcgType: tcgType
    });

  } catch (error) {
    console.error(`Error fetching ${tcgType} data:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      tcgType: tcgType
    });
  }
}