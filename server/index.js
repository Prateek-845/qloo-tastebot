import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const QLOO_API_KEY = process.env.QLOO_API_KEY;
const QLOO_BASE_URL = process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com/v2/insights';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

let debugLogs = [];
const MAX_LOGS = 100;

function logToFrontend(type, message, data = null) {
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type,
    message,
    data
  };
  debugLogs.unshift(logEntry);
  if (debugLogs.length > MAX_LOGS) {
    debugLogs = debugLogs.slice(0, MAX_LOGS);
  }
  console.log(message, data || '');
  return logEntry;
}

app.use(cors());
app.use(express.json());

logToFrontend('info', '🚀 OpenRouter-powered Movie Server initializing...');
logToFrontend('info', `🔑 QLOO_API_KEY: ${QLOO_API_KEY ? '✅ Present' : '❌ Missing'}`);
logToFrontend('info', `🤖 OPENROUTER_API_KEY: ${OPENROUTER_API_KEY ? '✅ Present' : '❌ Missing'}`);

// Enhanced OpenRouter API call function
async function callOpenRouter(messages, options = {}) {
  const {
    model = 'anthropic/claude-3-haiku',
    max_tokens = 800,
    temperature = 0.7,
    stream = false
  } = options;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Movie Recommendation System'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
        stream
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    logToFrontend('error', '💥 OpenRouter API error', { error: error.message });
    throw error;
  }
}

// Advanced Qloo URL Builder
function buildAdvancedQlooURL(base, params = {}) {
  const url = new URL(base);
  
  if (!params.filterType) {
    throw new Error('filterType is required for all Qloo requests');
  }
  url.searchParams.set('filter.type', params.filterType);
  
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'filterType' || !value) return;
    
    const qlooKey = key.replace(/([A-Z])/g, '.$1').toLowerCase();
    
    if (Array.isArray(value)) {
      url.searchParams.set(qlooKey, value.join(','));
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (subValue !== null && subValue !== undefined && subValue !== '') {
          url.searchParams.set(`${qlooKey}.${subKey}`, subValue);
        }
      });
    } else {
      url.searchParams.set(qlooKey, String(value));
    }
  });
  
  return url.toString();
}

// Validate primary signals
function validatePrimarySignals(params) {
  const primarySignals = [
    'signalInterestsEntities',
    'signalInterestsTags',
    'signalLocation',
    'signalLocationQuery'
  ];
  
  const hasSignal = primarySignals.some(signal => params[signal]);
  
  if (!hasSignal) {
    throw new Error('At least one primary signal is required');
  }
  
  return true;
}

// Get available OpenRouter models
app.get('/api/openrouter/models', async (req, res) => {
  logToFrontend('info', '🤖 Fetching OpenRouter models');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    logToFrontend('success', '📦 OpenRouter models fetched', { 
      modelCount: data.data?.length || 0 
    });
    
    res.json({ 
      ok: true, 
      models: data.data || [],
      totalModels: data.data?.length || 0
    });
    
  } catch (error) {
    logToFrontend('error', '💥 OpenRouter models error', { error: error.message });
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch OpenRouter models',
      details: error.message 
    });
  }
});

// Enhanced Movie Chat with OpenRouter
app.post('/api/chat/movies', async (req, res) => {
  const { userMessage = '', genre: requestedGenre, model = 'anthropic/claude-3-haiku' } = req.body;
  
  logToFrontend('info', '🎬 Movie chat request with OpenRouter', { userMessage, model });
  
  try {
    const genre = requestedGenre || extractGenre(userMessage);
    logToFrontend('info', `🔍 Extracted genre: ${genre}`);
    
    // Get movies from Qloo
    const qlooParams = {
      filterType: 'urn:entity:movie',
      signalInterestsTags: [`urn:tag:genre:media:${genre}`],
      take: 5
    };
    
    const qlooURL = buildAdvancedQlooURL(QLOO_BASE_URL, qlooParams);
    logToFrontend('info', `🌐 Qloo URL: ${qlooURL}`);
    
    const qlooResponse = await fetch(qlooURL, {
      headers: { 'x-api-key': QLOO_API_KEY }
    });
    
    const qlooData = await qlooResponse.json();
    const movies = qlooData.results?.entities || [];
    
    logToFrontend('success', '📦 Qloo response received', { 
      moviesFound: movies.length
    });
    
    const movieTitles = movies.map(m => m.title || m.name).join(', ');
    
    // Create enhanced chat messages for OpenRouter
    const messages = [
      {
        role: 'system',
        content: `You are a knowledgeable movie recommendation assistant with access to current movie data. You provide engaging, helpful recommendations and explain why movies are good choices. Always be conversational and enthusiastic about movies.`
      },
      {
        role: 'user',
        content: `User asked: "${userMessage || `Show me ${genre} movies`}"

Based on the genre "${genre}", here are some relevant movies from our database: ${movieTitles}

Please provide a conversational response that:
1. Acknowledges the user's request
2. Recommends movies from the list above
3. Briefly explains why these movies are good choices
4. Asks if they'd like more specific recommendations

Keep it friendly and engaging!`
      }
    ];
    
    logToFrontend('info', '💬 Sending request to OpenRouter');
    
    const botReply = await callOpenRouter(messages, { 
      model, 
      max_tokens: 500,
      temperature: 0.7 
    });
    
    logToFrontend('success', '📦 OpenRouter response received', { 
      model: model,
      hasReply: !!botReply
    });
    
    const finalResponse = {
      genre,
      userMessage,
      botReply,
      movies,
      movieCount: movies.length,
      model: model
    };
    
    res.json(finalResponse);
    
  } catch (error) {
    logToFrontend('error', '💥 Movie chat error', { error: error.message });
    res.status(500).json({
      error: 'Movie chat request failed',
      details: error.message
    });
  }
});

// Advanced Movie Analysis with OpenRouter
app.post('/api/analyze/movie', async (req, res) => {
  const { 
    movieTitle, 
    analysisType = 'summary', 
    model = 'anthropic/claude-3-haiku' 
  } = req.body;
  
  logToFrontend('info', '🎯 Movie analysis request', { movieTitle, analysisType, model });
  
  try {
    let systemMessage = 'You are a professional movie critic and analyst with deep knowledge of cinema.';
    let userPrompt;
    
    switch (analysisType) {
      case 'summary':
        userPrompt = `Provide a concise, spoiler-free summary of the movie "${movieTitle}". Include genre, main themes, and why someone might enjoy it.`;
        break;
      case 'review':
        userPrompt = `Write a balanced movie review for "${movieTitle}". Cover plot, acting, direction, and overall quality. Keep it under 200 words.`;
        break;
      case 'similar':
        userPrompt = `Suggest 5 movies similar to "${movieTitle}" and briefly explain why each is similar. Format as a numbered list.`;
        break;
      default:
        userPrompt = `Tell me about the movie "${movieTitle}".`;
    }
    
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];
    
    const analysis = await callOpenRouter(messages, { 
      model, 
      max_tokens: 600,
      temperature: 0.6 
    });
    
    logToFrontend('success', '📦 Movie analysis completed', { 
      movieTitle,
      analysisType,
      model
    });
    
    res.json({
      ok: true,
      analysis,
      movieTitle,
      analysisType,
      model
    });
    
  } catch (error) {
    logToFrontend('error', '💥 Movie analysis error', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Movie analysis failed',
      details: error.message
    });
  }
});

// Personalized Recommendations with OpenRouter
app.post('/api/recommendations/personalized', async (req, res) => {
  const { 
    preferences, 
    mood, 
    previousMovies = [], 
    model = 'anthropic/claude-3-haiku' 
  } = req.body;
  
  logToFrontend('info', '⭐ Personalized recommendations request', { preferences, mood, model });
  
  try {
    // Get movies from multiple genres based on preferences
    const genres = preferences.split(',').map(g => g.trim()).slice(0, 3);
    const allMovies = [];
    
    for (const genre of genres) {
      const params = {
        filterType: 'urn:entity:movie',
        signalInterestsTags: [`urn:tag:genre:media:${genre}`],
        take: 3
      };
      
      const response = await fetch(buildAdvancedQlooURL(QLOO_BASE_URL, params), {
        headers: { 'x-api-key': QLOO_API_KEY }
      });
      
      const data = await response.json();
      if (data.results?.entities) {
        allMovies.push(...data.results.entities);
      }
    }
    
    const movieList = allMovies.map(m => `${m.title || m.name} (${m.year || 'N/A'})`).join(', ');
    
    const messages = [
      {
        role: 'system',
        content: `You are a personalized movie recommendation expert. Consider user preferences, mood, and viewing history to make tailored suggestions.`
      },
      {
        role: 'user',
        content: `User preferences: ${preferences}
Current mood: ${mood}
Previously watched: ${previousMovies.join(', ')}

Available movies: ${movieList}

Based on this information, recommend 3-5 movies from the available list that would be perfect for this user right now. For each recommendation:
1. Explain why it matches their preferences
2. Why it fits their current mood
3. How it relates to their viewing history

Be specific and personalized in your recommendations.`
      }
    ];
    
    const recommendations = await callOpenRouter(messages, { 
      model, 
      max_tokens: 700,
      temperature: 0.7 
    });
    
    logToFrontend('success', '📦 Personalized recommendations completed', { 
      preferences,
      mood,
      model
    });
    
    res.json({
      ok: true,
      recommendations,
      availableMovies: allMovies,
      preferences,
      mood,
      model
    });
    
  } catch (error) {
    logToFrontend('error', '💥 Personalized recommendations error', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Personalized recommendations failed',
      details: error.message
    });
  }
});

// Original simple movie search (maintained for backward compatibility)
app.post('/api/movies', async (req, res) => {
  const { genre = 'comedy', take = 10 } = req.body;
  
  try {
    const params = {
      filterType: 'urn:entity:movie',
      signalInterestsTags: [`urn:tag:genre:media:${genre}`],
      take
    };
    
    const fullURL = buildAdvancedQlooURL(QLOO_BASE_URL, params);
    const response = await fetch(fullURL, {
      headers: { 'x-api-key': QLOO_API_KEY }
    });
    
    const data = await response.json();
    res.json({ ok: true, genre, movies: data.results?.entities || [] });
    
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Qloo fetch failed' });
  }
});

// Helper function to extract genre from user message
function extractGenre(text) {
  const genres = ['romance', 'comedy', 'horror', 'thriller', 'fiction', 'drama', 'action', 'sci-fi', 'fantasy', 'adventure', 'animation', 'crime', 'documentary', 'family', 'mystery', 'war', 'western'];
  const lowerText = text.toLowerCase();
  return genres.find(genre => lowerText.includes(genre)) || 'comedy';
}

// Debug endpoints
app.get('/api/debug/logs', (req, res) => {
  res.json({
    logs: debugLogs,
    totalLogs: debugLogs.length,
    serverUptime: process.uptime()
  });
});

app.post('/api/debug/clear', (req, res) => {
  debugLogs = [];
  logToFrontend('info', '🧹 Debug logs cleared');
  res.json({ message: 'Logs cleared', success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: Date.now(),
    services: {
      qloo: !!QLOO_API_KEY,
      openrouter: !!OPENROUTER_API_KEY
    }
  });
});

app.listen(PORT, () => {
  logToFrontend('success', `🚀 OpenRouter-powered server running on port ${PORT}`);
  logToFrontend('info', `🎬 Qloo API: ${QLOO_API_KEY ? '✅ Connected' : '❌ Missing Key'}`);
  logToFrontend('info', `🤖 OpenRouter API: ${OPENROUTER_API_KEY ? '✅ Connected' : '❌ Missing Key'}`);
});
