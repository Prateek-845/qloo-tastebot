import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:3001';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  
  // Simple search state
  const [genre, setGenre] = useState('comedy');
  const [take, setTake] = useState(10);
  const [movies, setMovies] = useState([]);
  
  // OpenRouter models
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3-haiku');
  
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

  useEffect(() => {
    fetchDebugLogs();
    fetchAvailableModels();
  }, []);

  const fetchDebugLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/logs`);
      const data = await response.json();
      setDebugLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch debug logs:', err);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/openrouter/models`);
      const data = await response.json();
      if (data.ok) {
        setAvailableModels(data.models);
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
      const response = await fetch(`${API_BASE_URL}/api/movies`, {
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
      setTimeout(fetchDebugLogs, 500);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage: chatMessage,
          model: selectedModel 
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.details || 'Chat failed');
      
      setChatHistory(prev => [...prev, 
        { type: 'user', message: chatMessage },
        { type: 'assistant', message: data.botReply, model: data.model }
      ]);
      setChatResponse(data.botReply);
      setChatMessage('');
      
      if (data.movies) {
        setMovies(data.movies);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(fetchDebugLogs, 500);
    }
  };

  const analyzeMovie = async (e) => {
    e.preventDefault();
    if (!analysisMovie.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze/movie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          movieTitle: analysisMovie, 
          analysisType,
          model: selectedModel 
        })
      });
      
      const data = await response.json();
      if (!data.ok) throw new Error(data.details || 'Analysis failed');
      
      setAnalysisResult(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(fetchDebugLogs, 500);
    }
  };

  const getRecommendations = async (e) => {
    e.preventDefault();
    if (!preferences.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/personalized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          preferences, 
          mood,
          model: selectedModel 
        })
      });
      
      const data = await response.json();
      if (!data.ok) throw new Error(data.details || 'Recommendations failed');
      
      setRecommendations(data.recommendations);
      if (data.availableMovies) {
        setMovies(data.availableMovies);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(fetchDebugLogs, 500);
    }
  };

  const renderModelSelector = () => (
    <div className="model-selector">
      <label>AI Model:</label>
      <select 
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="model-select"
      >
        <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast)</option>
        <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet (Balanced)</option>
        <option value="anthropic/claude-3-opus">Claude 3 Opus (Best)</option>
        <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="openai/gpt-4">GPT-4</option>
        <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B</option>
        <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
        <option value="google/gemini-pro">Gemini Pro</option>
        <option value="mistralai/mistral-7b-instruct">Mistral 7B</option>
        <option value="microsoft/wizardlm-2-8x22b">WizardLM 2 8x22B</option>
        {availableModels.map(model => (
          <option key={model.id} value={model.id}>
            {model.name || model.id}
          </option>
        ))}
      </select>
    </div>
  );

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
      {renderModelSelector()}
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
              {msg.model && <span className="model-badge">{msg.model}</span>}
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
      {renderModelSelector()}
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
      {renderModelSelector()}
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

  const renderDebugConsole = () => (
    <div className="debug-console">
      <div className="debug-header">
        <h3>🔍 Debug Console</h3>
        <button onClick={fetchDebugLogs} className="debug-btn">🔄 Refresh</button>
      </div>
      
      <div className="debug-logs">
        {debugLogs.map((log) => (
          <div key={log.id} className="debug-log-entry" style={getLogTypeStyle(log.type)}>
            <div className="log-header">
              <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="log-type">{log.type.toUpperCase()}</span>
            </div>
            <div className="log-message">{log.message}</div>
            {log.data && (
              <details className="log-data">
                <summary>View Data</summary>
                <pre>{JSON.stringify(log.data, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const getLogTypeStyle = (type) => {
    const styles = {
      info: { color: '#3498db', background: '#ebf3fd' },
      success: { color: '#27ae60', background: '#eafaf1' },
      error: { color: '#e74c3c', background: '#fdebea' },
      warning: { color: '#f39c12', background: '#fef5e7' }
    };
    return styles[type] || styles.info;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 OpenRouter-Powered Movie Recommendation System</h1>
        <p>Access to 280+ AI Models via OpenRouter</p>
        <div className="models-info">
          <small>Available Models: {availableModels.length} | Current: {selectedModel}</small>
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
        <button
          className={`tab-btn ${showDebugConsole ? 'active' : ''}`}
          onClick={() => setShowDebugConsole(!showDebugConsole)}
        >
          🔧 Debug
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
            <p>Processing with {selectedModel}...</p>
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

        {showDebugConsole && renderDebugConsole()}
      </main>
    </div>
  );
}
