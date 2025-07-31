import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const AI_MODELS = [
  'anthropic/claude-3-haiku',
  'anthropic/claude-3-sonnet',
  'anthropic/claude-3-opus',
  'openai/gpt-3.5-turbo',
  'openai/gpt-4',
  'meta-llama/llama-3-8b-instruct',
  'meta-llama/llama-3-70b-instruct',
  'google/gemini-pro',
  'mistralai/mistral-7b-instruct',
  'microsoft/wizardlm-2-8x22b',
];

const ENTITY_TYPES = [
  {
    key: 'artist',
    label: 'Artist',
    endpoint: '/api/artist/summary',
    params: [
      { name: 'bias.trends', label: 'Bias Trends', type: 'text' },
      { name: 'filter.exclude.entities', label: 'Exclude Entities', type: 'text' },
      { name: 'filter.parents.types', label: 'Parent Types', type: 'text' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
      { name: 'filter.exclude.tags', label: 'Exclude Tags', type: 'text' },
      { name: 'offset', label: 'Offset', type: 'number' },
      { name: 'signal.demographics.age', label: 'Demographics Age', type: 'text' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'book',
    label: 'Book',
    endpoint: '/api/book/summary',
    params: [
      { name: 'filter.publication_year.min', label: 'Min Publication Year', type: 'number' },
      { name: 'filter.publication_year.max', label: 'Max Publication Year', type: 'number' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
      { name: 'filter.exclude.tags', label: 'Exclude Tags', type: 'text' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'brand',
    label: 'Brand',
    endpoint: '/api/brand/summary',
    params: [
      { name: 'bias.trends', label: 'Bias Trends', type: 'text' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'destination',
    label: 'Destination',
    endpoint: '/api/destination/summary',
    params: [
      { name: 'filter.geocode.name', label: 'Geocode Name', type: 'text' },
      { name: 'filter.geocode.country_code', label: 'Country Code', type: 'text' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
      { name: 'signal.interests.entities', label: 'Interest Entities (comma-separated)', type: 'text', required: true },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'movie',
    label: 'Movie',
    endpoint: '/api/movie/summary',
    params: [
      { name: 'genre', label: 'Genre', type: 'text', required: true },
      { name: 'filter.release_year.min', label: 'Release Year Min', type: 'number' },
      { name: 'filter.release_year.max', label: 'Release Year Max', type: 'number' },
      { name: 'filter.content_rating', label: 'Content Rating', type: 'text' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'person',
    label: 'Person',
    endpoint: '/api/person/summary',
    params: [
      { name: 'filter.gender', label: 'Gender', type: 'text' },
      { name: 'filter.date_of_birth.min', label: 'Date of Birth Min', type: 'date' },
      { name: 'filter.date_of_birth.max', label: 'Date of Birth Max', type: 'date' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'place',
    label: 'Place',
    endpoint: '/api/place/summary',
    params: [
      { name: 'cuisines', label: 'Cuisines (comma-separated)', type: 'text', required: true },
      { name: 'filter.geocode.name', label: 'Geocode Name', type: 'text' },
      { name: 'filter.price_level.min', label: 'Min Price Level', type: 'number' },
      { name: 'filter.price_level.max', label: 'Max Price Level', type: 'number' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'podcast',
    label: 'Podcast',
    endpoint: '/api/podcast/summary',
    params: [
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
  {
    key: 'tvshow',
    label: 'TV Show',
    endpoint: '/api/tvshow/summary',
    params: [
      { name: 'filter.release_year.min', label: 'Release Year Min', type: 'number' },
      { name: 'filter.release_year.max', label: 'Release Year Max', type: 'number' },
      { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
      { name: 'take', label: 'Number to Return', type: 'number' },
    ],
  },
];

export default function QlooInsightExplorer() {
  const [selectedEntity, setSelectedEntity] = useState(ENTITY_TYPES[0]);
  const [paramValues, setParamValues] = useState({});
  const [userQuery, setUserQuery] = useState('');
  const [model, setModel] = useState(AI_MODELS[0]);
  const [result, setResult] = useState({ summary: '', titles: '', count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setParamValues({});
    setResult({ summary: '', titles: '', count: 0 });
    setError('');
    setUserQuery('');
  }, [selectedEntity]);

  const handleParamChange = (name, value) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateParams = () => {
    for (const p of selectedEntity.params) {
      if (p.required && (!paramValues[p.name] || paramValues[p.name].toString().trim() === '')) {
        setError(`Parameter "${p.label}" is required.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult({ summary: '', titles: '', count: 0 });

    if (!validateParams()) return;

    setLoading(true);
    const body = { ...paramValues, userQuery, model };

    // Handle comma-separated strings into arrays for certain params
    if (body.cuisines && typeof body.cuisines === 'string') {
      body.cuisines = body.cuisines.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (body['signal.interests.entities'] && typeof body['signal.interests.entities'] === 'string') {
      body['signal.interests.entities'] = body['signal.interests.entities'].split(',').map((s) => s.trim()).filter(Boolean);
    }

    try {
      const { data } = await axios.post(API_BASE_URL + selectedEntity.endpoint, body);
      if (data.ok) {
        let countKey = `${selectedEntity.label.toLowerCase().replace(/\s/g, '')}Count`;
        let titlesKey = `${selectedEntity.label.toLowerCase().replace(/\s/g, '')}Titles`;
        if (!data[countKey]) {
          countKey = Object.keys(data).find((k) => k.toLowerCase().includes('count')) || countKey;
        }
        if (!data[titlesKey]) {
          titlesKey = Object.keys(data).find((k) => k.toLowerCase().includes('title')) || titlesKey;
        }
        setResult({
          summary: data.summary || '',
          count: data[countKey] || 0,
          titles: data[titlesKey] || '',
        });
      } else {
        setError(data.error || data.message || 'No data found');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app" aria-live="polite">
      <header className="app-header">
        <h1>QFusion</h1>
        <p>Discover personalized taste-based recommendations using Qloo and AI.</p>
      </header>

      <main className="main-content" role="main">
        <form className="chat-form" onSubmit={handleSubmit} aria-busy={loading}>
          <label className="form-group" htmlFor="entity-select">
            Select Entity Type:
            <select
              id="entity-select"
              className="genre-select"
              value={selectedEntity.key}
              onChange={(e) => {
                const entity = ENTITY_TYPES.find((x) => x.key === e.target.value);
                setSelectedEntity(entity);
              }}
            >
              {ENTITY_TYPES.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>

          {selectedEntity.params.map((p) => (
            <label key={p.name} className="form-group" htmlFor={p.name}>
              {p.label}
              {p.required ? '*' : ''}:
              {p.type === 'text' && (
                <input
                  id={p.name}
                  type="text"
                  className="filter-input"
                  value={paramValues[p.name] || ''}
                  onChange={(e) => handleParamChange(p.name, e.target.value)}
                  required={p.required}
                  placeholder={p.label}
                />
              )}
              {p.type === 'number' && (
                <input
                  id={p.name}
                  type="number"
                  className="filter-input"
                  value={paramValues[p.name] || ''}
                  onChange={(e) => handleParamChange(p.name, e.target.value)}
                  required={p.required}
                  placeholder={p.label}
                />
              )}
              {p.type === 'date' && (
                <input
                  id={p.name}
                  type="date"
                  className="filter-input"
                  value={paramValues[p.name] || ''}
                  onChange={(e) => handleParamChange(p.name, e.target.value)}
                  required={p.required}
                />
              )}
            </label>
          ))}

          <label className="form-group" htmlFor="userQuery">
            Optional message for AI Summary:
            <textarea
              id="userQuery"
              className="message-input"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Guide the AI summary generation..."
              rows={3}
            />
          </label>

          <label className="form-group" htmlFor="model-select">
            Select AI Model:
            <select
              id="model-select"
              className="genre-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={loading} className="submit-btn" aria-disabled={loading}>
            {loading ? 'Fetching summary...' : 'Get AI Summary'}
          </button>
        </form>

        {error && (
          <div className="error-message" role="alert" aria-live="assertive" tabIndex={-1}>
            {error}
          </div>
        )}

        {loading && (
          <section className="loading" aria-live="polite" aria-label="Loading">
            <div className="spinner" />
            <p>Fetching recommendations...</p>
          </section>
        )}

        {result.summary && (
          <section className="chat-response">
            <div className="ai-message" tabIndex={0}>
              <strong>Summary:</strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>{result.summary}</p>
            </div>
          </section>
        )}

        {result.titles && result.count > 0 && (
          <section style={{ marginTop: 20, fontSize: 14, color: '#555', wordBreak: 'break-word' }} aria-label="Recommendation titles">
            <strong>{result.count}</strong> items included: {result.titles}
          </section>
        )}
      </main>
    </div>
  );
}