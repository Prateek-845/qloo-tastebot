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
  { key: 'artist', label: 'Artist', endpoint: '/api/artist/summary', params: [
    { name: 'bias.trends', label: 'Bias Trends', type: 'text' },
    { name: 'filter.exclude.entities', label: 'Exclude Entities', type: 'text' },
    { name: 'filter.parents.types', label: 'Parent Types', type: 'text' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
    { name: 'filter.exclude.tags', label: 'Exclude Tags', type: 'text' },
    { name: 'offset', label: 'Offset', type: 'number' },
    { name: 'signal.demographics.age', label: 'Demographics Age', type: 'text' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'book', label: 'Book', endpoint: '/api/book/summary', params: [
    { name: 'filter.publication_year.min', label: 'Min Publication Year', type: 'number' },
    { name: 'filter.publication_year.max', label: 'Max Publication Year', type: 'number' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
    { name: 'filter.exclude.tags', label: 'Exclude Tags', type: 'text' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'brand', label: 'Brand', endpoint: '/api/brand/summary', params: [
    { name: 'bias.trends', label: 'Bias Trends', type: 'text' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'destination', label: 'Destination', endpoint: '/api/destination/summary', params: [
    { name: 'filter.geocode.name', label: 'Geocode Name', type: 'text' },
    { name: 'filter.geocode.country_code', label: 'Country Code', type: 'text' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
    { name: 'signal.interests.entities', label: 'Interest Entities (comma-separated)', type: 'text', required: true },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'movie', label: 'Movie', endpoint: '/api/movie/summary', params: [
    { name: 'genre', label: 'Genre', type: 'text', required: true },
    { name: 'filter.release_year.min', label: 'Release Year Min', type: 'number' },
    { name: 'filter.release_year.max', label: 'Release Year Max', type: 'number' },
    { name: 'filter.content_rating', label: 'Content Rating', type: 'text' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'filter.popularity.max', label: 'Popularity Max (0-1)', type: 'number' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'person', label: 'Person', endpoint: '/api/person/summary', params: [
    { name: 'filter.gender', label: 'Gender', type: 'text' },
    { name: 'filter.date_of_birth.min', label: 'Date of Birth Min', type: 'date' },
    { name: 'filter.date_of_birth.max', label: 'Date of Birth Max', type: 'date' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'place', label: 'Place', endpoint: '/api/place/summary', params: [
    { name: 'cuisines', label: 'Cuisines (comma-separated)', type: 'text', required: true },
    { name: 'filter.geocode.name', label: 'Geocode Name', type: 'text' },
    { name: 'filter.price_level.min', label: 'Min Price Level', type: 'number' },
    { name: 'filter.price_level.max', label: 'Max Price Level', type: 'number' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'podcast', label: 'Podcast', endpoint: '/api/podcast/summary', params: [
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
  { key: 'tvshow', label: 'TV Show', endpoint: '/api/tvshow/summary', params: [
    { name: 'filter.release_year.min', label: 'Release Year Min', type: 'number' },
    { name: 'filter.release_year.max', label: 'Release Year Max', type: 'number' },
    { name: 'filter.popularity.min', label: 'Popularity Min (0-1)', type: 'number' },
    { name: 'take', label: 'Number to Return', type: 'number' },
  ]},
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
    setParamValues(prev => ({ ...prev, [name]: value }));
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
    if (body.cuisines && typeof body.cuisines === 'string') {
      body.cuisines = body.cuisines.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (body['signal.interests.entities'] && typeof body['signal.interests.entities'] === 'string') {
      body['signal.interests.entities'] = body['signal.interests.entities'].split(',').map(s => s.trim()).filter(Boolean);
    }

    try {
      const { data } = await axios.post(API_BASE_URL + selectedEntity.endpoint, body);
      if (data.ok) {
        let countKey = `${selectedEntity.label.toLowerCase().replace(/\s/g, '')}Count`;
        let titlesKey = `${selectedEntity.label.toLowerCase().replace(/\s/g, '')}Titles`;
        if (!data[countKey]) {
          countKey = Object.keys(data).find(k => k.toLowerCase().includes("count")) || countKey;
        }
        if (!data[titlesKey]) {
          titlesKey = Object.keys(data).find(k => k.toLowerCase().includes("title")) || titlesKey;
        }
        setResult({
          summary: data.summary || '',
          count: data[countKey] || 0,
          titles: data[titlesKey] || '',
        });
      } else {
        setError(data.error || data.message || "No data found");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', padding: 20 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>Qloo Insights API Explorer with AI Summaries</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          Select Entity Type:
          <select
            style={{ width: '100%', padding: 10, fontSize: 16, marginTop: 6 }}
            value={selectedEntity.key}
            onChange={e => {
              const entity = ENTITY_TYPES.find(x => x.key === e.target.value);
              setSelectedEntity(entity);
            }}
          >
            {ENTITY_TYPES.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
        </label>

        {selectedEntity.params.map(p => (
          <label key={p.name} style={{ display: 'block', marginBottom: 14 }}>
            {p.label}{p.required ? '*' : ''}:
            {p.type === 'text' && (
              <input
                type="text"
                value={paramValues[p.name] || ''}
                onChange={e => handleParamChange(p.name, e.target.value)}
                style={{ width: '100%', padding: 10, fontSize: 16, marginTop: 6, borderRadius: 4 }}
                required={p.required}
              />
            )}
            {p.type === 'number' && (
              <input
                type="number"
                value={paramValues[p.name] || ''}
                onChange={e => handleParamChange(p.name, e.target.value)}
                style={{ width: '100%', padding: 10, fontSize: 16, marginTop: 6, borderRadius: 4 }}
                required={p.required}
              />
            )}
            {p.type === 'date' && (
              <input
                type="date"
                value={paramValues[p.name] || ''}
                onChange={e => handleParamChange(p.name, e.target.value)}
                style={{ width: '100%', padding: 10, fontSize: 16, marginTop: 6, borderRadius: 4 }}
                required={p.required}
              />
            )}
          </label>
        ))}

        <label style={{ display: 'block', marginBottom: 16 }}>
          Optional message for AI Summary:
          <textarea
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            placeholder="Guide the AI summary generation..."
            rows={3}
            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 4, marginTop: 6 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 24 }}>
          Select AI Model:
          <select
            style={{ width: '100%', padding: 10, fontSize: 16, marginTop: 6, borderRadius: 4 }}
            value={model}
            onChange={e => setModel(e.target.value)}
          >
            {AI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            fontSize: 18,
            fontWeight: 'bold',
            backgroundColor: '#0078D7',
            color: 'white',
            padding: 16,
            borderRadius: 6,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 15px rgba(0,120,215,0.4)',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#005A9E')}
          onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#0078D7')}
        >
          {loading ? 'Fetching summary...' : 'Get AI Summary'}
        </button>

      </form>

      {error && (
        <div style={{ color: '#d93025', fontWeight: 'bold', backgroundColor: '#fdd', padding: 12, borderRadius: 6, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {result.summary && (
        <div style={{
          backgroundColor: '#e2f0d9',
          borderRadius: 10,
          padding: 20,
          fontSize: 18,
          lineHeight: 1.6,
          color: '#333',
          marginBottom: 20,
          whiteSpace: 'pre-wrap',
          boxShadow: '0 8px 20px rgba(0,128,0,0.15)'
        }}>
          <strong>Summary:</strong><br />
          {result.summary}
        </div>
      )}

      {result.titles && result.count > 0 && (
        <div style={{ fontSize: 14, color: '#555', wordBreak: 'break-word' }}>
          <strong>{result.count}</strong> items included: {result.titles}
        </div>
      )}
    </div>
  );
}
