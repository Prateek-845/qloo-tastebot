import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const QLOO_API_KEY = process.env.QLOO_API_KEY;
const QLOO_BASE_URL = process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com/v2/insights';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(cors());
app.use(express.json());

/**
 * Construct Qloo API URL for movie entities with exact parameter keys matching Qloo API spec
 */
function buildQlooMovieURL({ genre, releaseYearMin, releaseYearMax, take }) {
  const url = new URL(QLOO_BASE_URL);
  url.searchParams.set('filter.type', 'urn:entity:movie');

  if (genre) {
    url.searchParams.set('filter.tags', `urn:tag:genre:media:${genre.toLowerCase()}`);
  }
  if (releaseYearMin) {
    url.searchParams.set('filter.release_year.min', releaseYearMin);
  }
  if (releaseYearMax) {
    url.searchParams.set('filter.release_year.max', releaseYearMax);
  }
  if (take) {
    url.searchParams.set('take', take);
  }

  // Include explainability to help AI interpret why items were chosen (optional)
  url.searchParams.set('feature.explainability', 'true');

  return url.toString();
}

/**
 * Fetch movies from Qloo API
 */
async function fetchMovies(params) {
  const url = buildQlooMovieURL(params);
  const response = await fetch(url, { headers: { 'x-api-key': QLOO_API_KEY } });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qloo API request failed (${response.status}): ${errorText}`);
  }
  const data = await response.json();
  return data.results?.entities || [];
}

/**
 * Get AI summary from OpenRouter using precise movie data
 */
async function getOpenRouterSummary(movieTitles, genre, userQuery, model = 'anthropic/claude-3-haiku') {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key missing');

  const messages = [
    {
      role: 'system',
      content: 'You are a precise and clear movie recommendation assistant. Your responses focus strictly on movies relevant to the user’s genre request.'
    },
    {
      role: 'user',
      content: [
        userQuery ? `User query: "${userQuery}"` : `Please summarize movies in the ${genre} genre.`,
        `Here are movie titles: ${movieTitles}`,
        'Provide a concise summary highlighting what makes these movies interesting and relevant to fans of the genre. Avoid generalizations and focus on specifics.'
      ].join('\n\n')
    }
  ];

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': `http://localhost:${PORT}`,
      'X-Title': 'Qloo Movie Summary Service',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 500,
      temperature: 0.5,  // Lower temp for more focused output
    })
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const errMsg = errData.error?.message || resp.statusText || 'OpenRouter API error';
    throw new Error(errMsg);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'No summary generated';
}

// API endpoint: POST /api/movie/summary
app.post('/api/movie/summary', async (req, res) => {
  const {
    genre = 'comedy',
    releaseYearMin,
    releaseYearMax,
    take = 10,          // default number of movies to fetch
    userQuery = '',
    model = 'anthropic/claude-3-haiku'
  } = req.body;

  try {
    // Validate genre minimally: must be string and non-empty
    if (!genre || typeof genre !== 'string' || genre.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Genre parameter is required and must be non-empty string' });
    }

    // Fetch movies from Qloo exactly as per parameters
    const movies = await fetchMovies({ genre: genre.trim(), releaseYearMin, releaseYearMax, take });

    if (movies.length === 0) {
      return res.status(404).json({ ok: false, message: `No movies found for genre "${genre}" with given filters.` });
    }

    // Prepare titles for AI summary
    const movieTitles = movies.map(m => m.title || m.name).filter(Boolean).join(', ');

    // Get AI-generated precise summary
    const summary = await getOpenRouterSummary(movieTitles, genre.trim(), userQuery, model);

    // Respond with minimal data: summary + movie titles + count
    res.json({
      ok: true,
      genre: genre.trim(),
      movieCount: movies.length,
      movieTitles,
      summary,
    });
  } catch (error) {
    console.error('API error /api/movie/summary:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🎬 Movie summary backend running at http://localhost:${PORT}`);
});
