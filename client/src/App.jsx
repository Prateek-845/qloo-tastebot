import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001'; // Adjust if needed

const availableModels = [
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

export default function MovieSummaryApp() {
  const [genre, setGenre] = useState('comedy');
  const [releaseYearMin, setReleaseYearMin] = useState('');
  const [releaseYearMax, setReleaseYearMax] = useState('');
  const [take, setTake] = useState(10);
  const [userQuery, setUserQuery] = useState('');
  const [model, setModel] = useState(availableModels[0]);
  const [summary, setSummary] = useState('');
  const [movieTitles, setMovieTitles] = useState('');
  const [movieCount, setMovieCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSummary('');
    setMovieTitles('');
    setMovieCount(0);
    setError('');

    try {
      const payload = {
        genre: genre.trim(),
        model,
      };

      // Include optional fields only if valid
      if (releaseYearMin) payload.releaseYearMin = Number(releaseYearMin);
      if (releaseYearMax) payload.releaseYearMax = Number(releaseYearMax);
      if (take) payload.take = Number(take);
      if (userQuery.trim()) payload.userQuery = userQuery.trim();

      const response = await axios.post(`${API_BASE_URL}/api/movie/summary`, payload);

      if (response.data.ok) {
        setSummary(response.data.summary || '');
        setMovieTitles(response.data.movieTitles || '');
        setMovieCount(response.data.movieCount || 0);
      } else {
        setError(response.data.error || response.data.message || 'Failed to get summary');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>🎬 Movie Summary (Qloo + OpenRouter)</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Genre:<br />
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              required
              placeholder="e.g. comedy, thriller, drama"
              style={{ width: '100%', padding: 8, fontSize: 16 }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <label style={{ flex: 1 }}>
            Release Year Min:<br />
            <input
              type="number"
              value={releaseYearMin}
              onChange={e => setReleaseYearMin(e.target.value)}
              placeholder="e.g. 2000"
              style={{ width: '100%', padding: 8, fontSize: 16 }}
              min="1888"
            />
          </label>
          <label style={{ flex: 1 }}>
            Release Year Max:<br />
            <input
              type="number"
              value={releaseYearMax}
              onChange={e => setReleaseYearMax(e.target.value)}
              placeholder="e.g. 2025"
              style={{ width: '100%', padding: 8, fontSize: 16 }}
              min="1888"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Number of Movies (take):<br />
            <input
              type="number"
              value={take}
              onChange={e => setTake(e.target.value)}
              min="1"
              max="100"
              style={{ width: '100%', padding: 8, fontSize: 16 }}
              placeholder="Number of movies to fetch"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Optional Message for AI:<br />
            <textarea
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="e.g. Looking for fun & lighthearted movies"
              rows={3}
              style={{ width: '100%', padding: 8, fontSize: 16 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>
            Select AI Model:<br />
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{ width: '100%', padding: 8, fontSize: 16 }}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            fontSize: 18,
            fontWeight: 'bold',
            backgroundColor: '#ff4081',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(255,64,129,0.4)',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#e91e63')}
          onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#ff4081')}
        >
          {loading ? 'Generating summary...' : 'Get Movie Summary'}
        </button>
      </form>

      {error && (
        <div style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: 20 }}>{error}</div>
      )}

      {summary && (
        <div style={{
          fontSize: 18,
          lineHeight: 1.6,
          backgroundColor: '#fff0f6',
          padding: 20,
          borderRadius: 10,
          border: '2px solid #ff4081',
          color: '#5a2a49',
          whiteSpace: 'pre-wrap',
          boxShadow: '0 8px 20px rgba(255,64,129,0.15)',
          fontWeight: '500',
          marginBottom: 12,
        }}>
          <strong>Summary:</strong><br />{summary}
        </div>
      )}

      {movieTitles && movieCount > 0 && (
        <div style={{ fontSize: 14, color: '#888' }}>
          <strong>{movieCount}</strong> titles included: {movieTitles}
        </div>
      )}
    </div>
  );
}
