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

function setParam(searchParams, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    if (value.length > 0) searchParams.set(key, value.join(','));
  } else if (typeof value === 'boolean') {
    searchParams.set(key, value ? 'true' : 'false');
  } else {
    searchParams.set(key, value.toString());
  }
}

const entityTypeParams = {
  'urn:entity:artist': [
    'bias.trends',
    'filter.exclude.entities', 'filter.parents.types',
    'filter.popularity.min', 'filter.popularity.max',
    'filter.exclude.tags', 'operator.exclude.tags',
    'filter.external.exists', 'operator.filter.external.exists',
    'filter.results.entities', 'filter.results.entities.query',
    'filter.tags', 'operator.filter.tags',
    'offset',
    'signal.demographics.age', 'signal.demographics.audiences', 'signal.demographics.audiences.weight',
    'signal.demographics.gender',
    'signal.interests.entities', 'signal.interests.tags',
    'take'
  ],
  'urn:entity:book': [
    'bias.trends',
    'filter.exclude.entities', 'filter.exclude.tags', 'operator.exclude.tags',
    'filter.external.exists', 'operator.filter.external.exists',
    'filter.parents.types',
    'filter.popularity.min', 'filter.popularity.max',
    'filter.publication_year.min', 'filter.publication_year.max',
    'filter.results.entities', 'filter.results.entities.query',
    'filter.tags', 'operator.filter.tags',
    'offset',
    'signal.demographics.audiences', 'signal.demographics.age', 'signal.demographics.audiences.weight',
    'signal.demographics.gender',
    'signal.interests.entities', 'signal.interests.tags',
    'take'
  ],
  'urn:entity:brand': [
    'bias.trends',
    'filter.exclude.entities', 'operator.exclude.tags', 'filter.exclude.tags',
    'filter.external.exists', 'operator.filter.external.exists',
    'filter.parents.types',
    'filter.popularity.min', 'filter.popularity.max',
    'filter.results.entities', 'filter.results.entities.query',
    'filter.tags', 'operator.filter.tags',
    'signal.demographics.age', 'signal.demographics.audiences', 'signal.demographics.audiences.weight',
    'signal.interests.entities',
    'signal.demographics.gender',
    'signal.interests.tags',
    'offset',
    'take'
  ],
  'urn:entity:destination': [
    'bias.trends',
    'filter.exclude.entities',
    'filter.external.exists', 'operator.filter.external.exists',
    'filter.exclude.tags', 'operator.exclude.tags',
    'filter.geocode.name', 'filter.geocode.admin1_region', 'filter.geocode.admin2_region', 'filter.geocode.country_code',
    'filter.location', 'filter.location.radius', 'filter.location.geohash', 'filter.exclude.location.geohash',
    'filter.parents.types',
    'filter.popularity.min', 'filter.popularity.max',
    'filter.results.entities', 'filter.results.entities.query',
    'filter.tags', 'operator.filter.tags',
    'offset',
    'signal.demographics.age', 'signal.demographics.audiences', 'signal.demographics.audiences.weight',
    'signal.demographics.gender',
    'signal.interests.entities', // Required for destinations
    'signal.interests.tags',
    'take'
  ],
  'urn:entity:movie': [
    'bias.trends',
    'filter.content_rating',
    'filter.exclude.entities',
    'filter.external.exists',
    'operator.filter.external.exists',
    'filter.exclude.tags',
    'operator.filter.exclude.tags',
    'filter.parents.types',
    'filter.popularity.min',
    'filter.popularity.max',
    'filter.release_year.min',
    'filter.release_year.max',
    'filter.release_country',
    'operator.filter.release_country',
    'filter.rating.min',
    'filter.rating.max',
    'filter.results.entities',
    'filter.results.entities.query',
    'filter.tags',
    'operator.filter.tags',
    'offset',
    'signal.demographics.audiences',
    'signal.demographics.age',
    'signal.demographics.audiences.weight',
    'signal.demographics.gender',
    'signal.interests.entities',
    'signal.interests.tags',
    'take'
  ],
  'urn:entity:person': [
    'bias.trends',
    'filter.date_of_birth.min',
    'filter.date_of_birth.max',
    'filter.date_of_death.min',
    'filter.date_of_death.max',
    'filter.exclude.entities',
    'filter.external.exists',
    'operator.filter.external.exists',
    'filter.exclude.tags',
    'operator.filter.exclude.tags',
    'filter.gender',
    'filter.parents.types',
    'filter.popularity.max',
    'filter.popularity.min',
    'filter.results.entities',
    'filter.results.entities.query',
    'filter.tags',
    'operator.filter.tags',
    'offset',
    'signal.demographics.age',
    'signal.demographics.audiences',
    'signal.demographics.audiences.weight',
    'signal.demographics.gender',
    'signal.interests.entities',
    'signal.interests.tags',
    'take'
  ],
  'urn:entity:place': [
    'bias.trends',
    'filter.address',
    'filter.exclude.entities',
    'filter.exclude.tags',
    'operator.filter.exclude.tags',
    'filter.external.exists',
    'operator.filter.external.exists',
    'filter.external.tripadvisor.rating.count.max',
    'filter.external.tripadvisor.rating.count.min',
    'filter.external.tripadvisor.rating.max',
    'filter.external.tripadvisor.rating.min',
    'filter.geocode.name',
    'filter.geocode.admin1_region',
    'filter.geocode.admin2_region',
    'filter.geocode.country_code',
    'filter.hotel_class.max',
    'filter.hotel_class.min',
    'filter.hours',
    'filter.location',
    'filter.location.geohash',
    'filter.exclude.location.geohash',
    'filter.location.radius',
    'filter.parents.types',
    'filter.popularity.min',
    'filter.popularity.max',
    'filter.price_level.min',
    'filter.price_level.max',
    'filter.price_range.from',
    'filter.price_range.to',
    'filter.properties.business_rating.min',
    'filter.properties.business_rating.max',
    'filter.properties.resy.rating.min',
    'filter.properties.resy.rating.max',
    'filter.references_brand',
    'filter.results.entities',
    'filter.results.entities.query',
    'filter.resy.rating_count.min',
    'filter.resy.rating_count.max',
    'filter.resy.rating.party.min',
    'filter.resy.rating.party.max',
    'filter.tags',
    'operator.filter.tags',
    'offset',
    'signal.demographics.age',
    'signal.demographics.audiences',
    'signal.demographics.audiences.weight',
    'signal.demographics.gender',
    'signal.interests.entities',
    'signal.interests.tags',
    'take'
  ],
  'urn:entity:podcast': [
    'bias.trends',
    'filter.exclude.entities',
    'filter.exclude.tags',
    'operator.filter.exclude.tags',
    'filter.external.exists',
    'operator.filter.external.exists',
    'filter.parents.types',
    'filter.popularity.max',
    'filter.popularity.min',
    'filter.results.entities',
    'filter.results.entities.query',
    'filter.tags',
    'operator.filter.tags',
    'offset',
    'signal.demographics.gender',
    'signal.demographics.age',
    'signal.demographics.audiences',
    'signal.demographics.audiences.weight',
    'signal.interests.entities',
    'signal.interests.tags',
    'take'
  ],
  'urn:entity:tv_show': [
    'bias.trends',
    'filter.content_rating',
    'filter.exclude.entities',
    'filter.external.exists',
    'operator.filter.external.exists',
    'filter.exclude.tags',
    'operator.filter.exclude.tags',
    'filter.finale_year.max',
    'filter.finale_year.min',
    'filter.latest_known_year.max',
    'filter.latest_known_year.min',
    'filter.parents.types',
    'filter.popularity.max',
    'filter.popularity.min',
    'filter.release_year.max',
    'filter.release_year.min',
    'filter.release_country',
    'operator.filter.release_country',
    'filter.rating.max',
    'filter.rating.min',
    'filter.results.entities',
    'filter.results.entities.query',
    'filter.tags',
    'operator.filter.tags',
    'offset',
    'signal.demographics.age',
    'signal.demographics.audiences',
    'signal.demographics.audiences.weight',
    'signal.demographics.gender',
    'signal.interests.entities',
    'signal.interests.tags',
    'take'
  ]
};

function buildQlooURL(filterType, params) {
  if (!filterType) throw new Error('filterType is required');

  const url = new URL(QLOO_BASE_URL);
  url.searchParams.set('filter.type', filterType);

  const allowedParams = entityTypeParams[filterType] || [];

  if ('genre' in params && filterType === 'urn:entity:movie') {
    setParam(url.searchParams, 'filter.tags', `urn:tag:genre:media:${params.genre.toLowerCase()}`);
  }
  if ('cuisines' in params && filterType === 'urn:entity:place') {
    const cuisineTags = params.cuisines
      .filter(c => c && c.trim())
      .map(c => `urn:tag:genre:place:restaurant:${c.trim().toLowerCase()}`);
    if (cuisineTags.length) setParam(url.searchParams, 'filter.tags', cuisineTags);
  }

  for (const [key, value] of Object.entries(params)) {
    if (key !== 'genre' && key !== 'cuisines' && allowedParams.includes(key)) {
      setParam(url.searchParams, key, value);
    }
  }

  return url.toString();
}

async function fetchQlooData(filterType, params) {
  const url = buildQlooURL(filterType, params);
  const res = await fetch(url, { headers: { 'x-api-key': QLOO_API_KEY } });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Qloo API error: ${res.status} ${errBody}`);
  }
  const json = await res.json();
  return json.results?.entities || [];
}

async function getAISummary(itemsList, category, userPrompt = '', model = 'anthropic/claude-3-haiku') {
  if (!OPENROUTER_API_KEY) throw new Error('Missing OpenRouter API key');

  const messages = [
    {
      role: 'system',
      content: `You are an expert assistant that generates precise, engaging, and relevant summaries about the following ${category}.`,
    },
    {
      role: 'user',
      content: [
        userPrompt ? `User prompt: "${userPrompt}"` : `Please summarize the following ${category}:`,
        itemsList,
        'Focus on what makes these items interesting based on the filters.',
      ].join('\n\n'),
    },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 700,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'OpenRouter API call error');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No summary generated';
}

function createEntityEndpoint(filterType, categoryName, titleKey = 'title') {
  return async (req, res) => {
    const {
      take = 10,
      userQuery = '',
      model = 'anthropic/claude-3-haiku',
      ...params
    } = req.body;

    if (filterType === 'urn:entity:movie' && (!params.genre || !params.genre.trim())) {
      return res.status(400).json({ ok: false, error: 'genre parameter is required for movies' });
    }
    if (filterType === 'urn:entity:place' && (!params.cuisines || (Array.isArray(params.cuisines) && params.cuisines.length === 0))) {
      return res.status(400).json({ ok: false, error: 'cuisines parameter is required for places' });
    }

    try {
      const allParams = { ...params, take };
      const entities = await fetchQlooData(filterType, allParams);
      if (entities.length === 0) {
        return res.status(404).json({ ok: false, message: `No ${categoryName} found matching filters.` });
      }

      const itemsList = entities.map(e => e[titleKey] || e.name || 'Untitled').join(', ');

      const summary = await getAISummary(itemsList, categoryName, userQuery, model);

      const countKey = categoryName.toLowerCase().replace(/\s/g, '') + 'Count';
      const titlesKey = categoryName.toLowerCase().replace(/\s/g, '') + 'Titles';

      return res.json({
        ok: true,
        [countKey]: entities.length,
        [titlesKey]: itemsList,
        summary,
      });
    } catch (error) {
      console.error(`Error in ${categoryName} endpoint:`, error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}

// Routes (no video game)
app.post('/api/artist/summary', createEntityEndpoint('urn:entity:artist', 'artists'));
app.post('/api/book/summary', createEntityEndpoint('urn:entity:book', 'books'));
app.post('/api/brand/summary', createEntityEndpoint('urn:entity:brand', 'brands'));
app.post('/api/destination/summary', createEntityEndpoint('urn:entity:destination', 'destinations'));
app.post('/api/movie/summary', createEntityEndpoint('urn:entity:movie', 'movies'));
app.post('/api/person/summary', createEntityEndpoint('urn:entity:person', 'people', 'name'));
app.post('/api/place/summary', createEntityEndpoint('urn:entity:place', 'places'));
app.post('/api/podcast/summary', createEntityEndpoint('urn:entity:podcast', 'podcasts'));
app.post('/api/tvshow/summary', createEntityEndpoint('urn:entity:tv_show', 'tvshows', 'title'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Qloo AI summary backend listening on port ${PORT}`);
});