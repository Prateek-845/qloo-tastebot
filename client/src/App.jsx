import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:3001';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [genre, setGenre] = useState('comedy');
  const [take, setTake] = useState(10);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Chat functionality
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  
  // Analysis functionality
  const [analysisMovie, setAnalysisMovie] = useState('');
  const [analysisType, setAnalysisType] = useState('summary');
  const [analysisResult, setAnalysisResult] = useState('');
  
  // Recommendation functionality
  const [preferences, setPreferences] = useState('');
  const [mood, setMood] = useState('');
  const [recommendations, setRecommendations] = useState('');
  
  // Models
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/openai/models`);
      const data = await response.json();
      if (data.ok) {
        setModels(data.models);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const searchMovies = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMovies([]);
    
    try {
      const response = await fetch(`${API_BASE}/api/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, take: +take })
      });
      
      const data = await response.json();
      if (!data.ok) throw new Error(data.msg || 'Search failed');
      
      setMovies(data.movies);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage })
      });
      
      const data = await response.json();
      if (!data.ok) throw new Error(data.msg || 'Chat failed');
      
      setChatHistory(prev => [...prev, 
        { type: 'user', message: chatMessage },
        { type: 'assistant', message: data.response }
      ]);
      setChatResponse(data.response);
      setChatMessage('');
      
      if (data.movies) {
        setMovies(data.movies);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeMovie = async (e) => {
    e.preventDefault();
    if (!analysisMovie.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          movieTitle: analysisMovie, 
          analysisType 
        })
      });
      
      const data = await response.json();
      if (!data.ok) throw new Error(data.msg || 'Analysis failed');
      
      setAnalysisResult(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (e) => {
    e.preventDefault();
    if (!preferences.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, mood })
      });
      
      const data = await response.json();
      if (!data.ok) throw new Error(data.msg || 'Recommendations failed');
      
      setRecommendations(data.recommendations);
      if (data.availableMovies) {
        setMovies(data.availableMovies);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchTab = () => (
    <div className="tab-content">
      <h2>🔍 Search Movies</h2>
      <form onSubmit={searchMovies} className="search-form">
        <div className="form-group">
          <label>Genre:</label>
          <input 
            value={genre} 
            onChange={e => setGenre(e.target.value)}
            placeholder="comedy, action, drama..."
          />
        </div>
        <div className="form-group">
          <label>Count:</label>
          <input 
            type="number" 
            min="1" 
            max="50"
            value={take} 
            onChange={e => setTake(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Movies'}
        </button>
      </form>
    </div>
  );

  const renderChatTab = () => (
    <div className="tab-content">
      <h2>💬 AI Movie Chat</h2>
      <form onSubmit={sendChatMessage} className="chat-form">
        <div className="form-group">
          <label>Ask about movies:</label>
          <textarea
            value={chatMessage}
            onChange={e => setChatMessage(e.target.value)}
            placeholder="What kind of movies do you want to watch tonight?"
            rows="3"
          />
        </div>
        <button type="submit" disabled={loading || !chatMessage.trim()}>
          {loading ? 'Thinking...' : 'Send Message'}
        </button>
      </form>
      
      {chatHistory.length > 0 && (
        <div className="chat-history">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`message ${msg.type}`}>
              <strong>{msg.type === 'user' ? 'You' : 'AI'}:</strong>
              <p>{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="tab-content">
      <h2>🎯 Movie Analysis</h2>
      <form onSubmit={analyzeMovie} className="analysis-form">
        <div className="form-group">
          <label>Movie Title:</label>
          <input
            value={analysisMovie}
            onChange={e => setAnalysisMovie(e.target.value)}
            placeholder="Enter movie title..."
          />
        </div>
        <div className="form-group">
          <label>Analysis Type:</label>
          <select 
            value={analysisType} 
            onChange={e => setAnalysisType(e.target.value)}
          >
            <option value="summary">Summary</option>
            <option value="review">Review</option>
            <option value="similar">Similar Movies</option>
          </select>
        </div>
        <button type="submit" disabled={loading || !analysisMovie.trim()}>
          {loading ? 'Analyzing...' : 'Analyze Movie'}
        </button>
      </form>
      
      {analysisResult && (
        <div className="analysis-result">
          <h3>Analysis Result:</h3>
          <div className="result-content">
            {analysisResult.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRecommendTab = () => (
    <div className="tab-content">
      <h2>⭐ Personalized Recommendations</h2>
      <form onSubmit={getRecommendations} className="recommend-form">
        <div className="form-group">
          <label>Your Preferences:</label>
          <input
            value={preferences}
            onChange={e => setPreferences(e.target.value)}
            placeholder="comedy, action, sci-fi..."
          />
        </div>
        <div className="form-group">
          <label>Current Mood:</label>
          <input
            value={mood}
            onChange={e => setMood(e.target.value)}
            placeholder="relaxed, adventurous, thoughtful..."
          />
        </div>
        <button type="submit" disabled={loading || !preferences.trim()}>
          {loading ? 'Generating...' : 'Get Recommendations'}
        </button>
      </form>
      
      {recommendations && (
        <div className="recommendations-result">
          <h3>Your Personalized Recommendations:</h3>
          <div className="result-content">
            {recommendations.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 AI-Powered Movie Recommendation System</h1>
        <p>Powered by Qloo Cultural Intelligence & OpenAI GPT</p>
        <div className="models-info">
          <small>Available Models: {models.length} | GPT Integration: Active</small>
        </div>
      </header>

      <nav className="tab-nav">
        <button 
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search
        </button>
        <button 
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          💬 AI Chat
        </button>
        <button 
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          🎯 Analysis
        </button>
        <button 
          className={activeTab === 'recommend' ? 'active' : ''}
          onClick={() => setActiveTab('recommend')}
        >
          ⭐ Recommend
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'recommend' && renderRecommendTab()}

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {movies.length > 0 && (
          <div className="results">
            <h2>🎬 Results ({movies.length})</h2>
            <div className="movie-grid">
              {movies.map((movie, i) => (
                <div key={i} className="movie-card">
                  <h3>{movie.title || movie.name || 'Untitled'}</h3>
                  {movie.year && <p className="year">({movie.year})</p>}
                  {movie.description && <p className="description">{movie.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
