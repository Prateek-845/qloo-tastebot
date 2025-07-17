import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const QLOO_KEY = process.env.QLOO_API_KEY;
const QLOO_URL = process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com/v2/insights';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

// Helper Functions
const buildQlooURL = (genre, take = 10) => {
  const url = new URL(QLOO_URL);
  url.searchParams.set('filter.type', 'urn:entity:movie');
  url.searchParams.set('filter.tags', `urn:tag:genre:media:${genre}`);
  url.searchParams.set('take', take);
  return url.toString();
};

const extractGenre = (text) => {
  const genres = ['action', 'comedy', 'drama', 'horror', 'romance', 'thriller', 'sci-fi', 'fantasy', 'adventure', 'animation'];
  const lowerText = text.toLowerCase();
  return genres.find(genre => lowerText.includes(genre)) || 'comedy';
};

// OpenAI GPT Integration
const callGPT = async (prompt, systemMessage = null) => {
  const messages = [];
  
  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }
  
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 800,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
};

// API Endpoints

// Get OpenAI Models
app.get('/api/openai/models', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}` }
    });
    const data = await response.json();
    res.json({ ok: true, models: data.data || [] });
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Failed to fetch OpenAI models' });
  }
});

// Enhanced Movie Search with GPT
app.post('/api/movies', async (req, res) => {
  const { genre = 'comedy', take = 10 } = req.body;
  
  try {
    const response = await fetch(buildQlooURL(genre, take), {
      headers: { 'x-api-key': QLOO_KEY }
    });
    const json = await response.json();
    const movies = json.results?.entities || [];
    
    res.json({ ok: true, genre, movies });
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Qloo fetch failed' });
  }
});

// Intelligent Movie Chat with GPT
app.post('/api/chat', async (req, res) => {
  const { message, context = '' } = req.body;
  
  try {
    // Extract genre from user message
    const genre = extractGenre(message);
    
    // Fetch movies from Qloo
    const qlooResponse = await fetch(buildQlooURL(genre, 5), {
      headers: { 'x-api-key': QLOO_KEY }
    });
    const qlooData = await qlooResponse.json();
    const movies = qlooData.results?.entities || [];
    
    // Create movie list for GPT
    const movieList = movies.map(m => `${m.title || m.name} (${m.year || 'N/A'})`).join(', ');
    
    // System message for GPT
    const systemMessage = `You are a knowledgeable movie recommendation assistant. You have access to current movie data and should provide engaging, helpful recommendations. Always be conversational and enthusiastic about movies.`;
    
    // Enhanced prompt for GPT
    const gptPrompt = `
User asked: "${message}"

Based on the genre "${genre}", here are some relevant movies: ${movieList}

Please provide a conversational response that:
1. Acknowledges the user's request
2. Recommends movies from the list above
3. Briefly explains why these movies are good choices
4. Asks if they'd like more specific recommendations

Keep it friendly and engaging!
`;

    const gptResponse = await callGPT(gptPrompt, systemMessage);
    
    res.json({
      ok: true,
      response: gptResponse,
      genre,
      movies,
      context: message
    });
    
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Chat processing failed' });
  }
});

// GPT-Powered Movie Analysis
app.post('/api/analyze', async (req, res) => {
  const { movieTitle, analysisType = 'summary' } = req.body;
  
  try {
    let prompt;
    let systemMessage = 'You are a professional movie critic and analyst with deep knowledge of cinema.';
    
    switch (analysisType) {
      case 'summary':
        prompt = `Provide a concise, spoiler-free summary of the movie "${movieTitle}". Include genre, main themes, and why someone might enjoy it.`;
        break;
      case 'review':
        prompt = `Write a balanced movie review for "${movieTitle}". Cover plot, acting, direction, and overall quality. Keep it under 200 words.`;
        break;
      case 'similar':
        prompt = `Suggest 5 movies similar to "${movieTitle}" and briefly explain why each is similar. Format as a numbered list.`;
        break;
      default:
        prompt = `Tell me about the movie "${movieTitle}".`;
    }
    
    const analysis = await callGPT(prompt, systemMessage);
    
    res.json({
      ok: true,
      analysis,
      movieTitle,
      analysisType
    });
    
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Analysis failed' });
  }
});

// Personalized Recommendations with GPT
app.post('/api/recommend', async (req, res) => {
  const { preferences, mood, previousMovies = [] } = req.body;
  
  try {
    // Get movies from multiple genres based on preferences
    const genres = preferences.split(',').map(g => g.trim()).slice(0, 3);
    const allMovies = [];
    
    for (const genre of genres) {
      const response = await fetch(buildQlooURL(genre, 3), {
        headers: { 'x-api-key': QLOO_KEY }
      });
      const data = await response.json();
      if (data.results?.entities) {
        allMovies.push(...data.results.entities);
      }
    }
    
    const movieList = allMovies.map(m => `${m.title || m.name} (${m.year || 'N/A'})`).join(', ');
    
    const systemMessage = `You are a personalized movie recommendation expert. Consider user preferences, mood, and viewing history to make tailored suggestions.`;
    
    const prompt = `
User preferences: ${preferences}
Current mood: ${mood}
Previously watched: ${previousMovies.join(', ')}

Available movies: ${movieList}

Based on this information, recommend 3-5 movies from the available list that would be perfect for this user right now. For each recommendation:
1. Explain why it matches their preferences
2. Why it fits their current mood
3. How it relates to their viewing history

Be specific and personalized in your recommendations.
`;

    const recommendations = await callGPT(prompt, systemMessage);
    
    res.json({
      ok: true,
      recommendations,
      availableMovies: allMovies,
      preferences,
      mood
    });
    
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Personalized recommendations failed' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: Date.now(),
    services: {
      qloo: !!QLOO_KEY,
      openai: !!OPENAI_KEY
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎬 Qloo API: ${QLOO_KEY ? '✅' : '❌'}`);
  console.log(`🤖 OpenAI API: ${OPENAI_KEY ? '✅' : '❌'}`);
});
