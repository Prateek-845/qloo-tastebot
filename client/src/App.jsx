import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://localhost:3001";

const axiosApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export default function App() {
  // ADD these alongside other useStates
  const [location, setLocation] = useState("");
  const [diningNarrative, setDiningNarrative] = useState("");

  // Dining
  const [cuisine, setCuisine] = useState("");
  const [diningResults, setDiningResults] = useState("");

  // Fashion
  const [style, setStyle] = useState("");
  const [fashionResults, setFashionResults] = useState("");

  // Travel
  const [theme, setTheme] = useState("");
  const [travelLocation, setTravelLocation] = useState("");
  const [travelResults, setTravelResults] = useState("");

  const [activeTab, setActiveTab] = useState("search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  const [genre, setGenre] = useState("comedy");
  const [take, setTake] = useState(10);
  const [movies, setMovies] = useState([]);

  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(
    "anthropic/claude-3-haiku"
  );

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const [analysisMovie, setAnalysisMovie] = useState("");
  const [analysisType, setAnalysisType] = useState("summary");
  const [analysisResult, setAnalysisResult] = useState("");

  const [preferences, setPreferences] = useState("");
  const [mood, setMood] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const apiPost = async (url, data) => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosApi.post(url, data);
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          err.response?.data?.details ||
          err.message ||
          "Something went wrong"
      );
      return null;
    } finally {
      setLoading(false);
      setTimeout(fetchDebugLogs, 500);
    }
  };

  const fetchDebugLogs = async () => {
    try {
      const { data } = await axiosApi.get("/api/debug/logs");
      setDebugLogs(data.logs || []);
    } catch (err) {}
  };

  const fetchAvailableModels = async () => {
    try {
      const { data } = await axiosApi.get("/api/openrouter/models");
      if (data.ok) setAvailableModels(data.models);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDebugLogs();
    fetchAvailableModels();
  }, []);

  const searchMovies = async (e) => {
    e.preventDefault();
    setMovies([]);
    const data = await apiPost("/api/movies", { genre, take: +take });
    if (data?.ok) setMovies(data.movies);
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const data = await apiPost("/api/chat/movies", {
      userMessage: chatMessage,
      model: selectedModel,
    });
    if (data && !data.error) {
      setChatHistory((prev) => [
        ...prev,
        { type: "user", message: chatMessage },
        { type: "assistant", message: data.botReply, model: data.model },
      ]);
      setChatMessage("");
      if (data.movies) setMovies(data.movies);
    }
  };

  const analyzeMovie = async (e) => {
    e.preventDefault();
    if (!analysisMovie.trim()) return;
    const data = await apiPost("/api/analyze/movie", {
      movieTitle: analysisMovie,
      analysisType,
      model: selectedModel,
    });
    if (data?.ok) setAnalysisResult(data.analysis);
  };

  const getRecommendations = async (e) => {
    e.preventDefault();
    if (!preferences.trim()) return;
    const data = await apiPost("/api/recommendations/personalized", {
      preferences,
      mood,
      model: selectedModel,
    });
    if (data?.ok) {
      setRecommendations(data.recommendations);
      if (data.availableMovies) setMovies(data.availableMovies);
    }
  };

  const getDiningSuggestions = async (e) => {
    e.preventDefault();
    if (!cuisine.trim()) return;
    const data = await apiPost("/api/dining", {
      cuisine,
      model: selectedModel,
    });
    if (data?.ok) setDiningResults(data.reply);
  };

  const getFashionSuggestions = async (e) => {
    e.preventDefault();
    if (!style.trim()) return;
    const data = await apiPost("/api/fashion", {
      preferences: style, // 👈 this is the key your backend expects
      model: selectedModel,
    });
    if (data?.ok) setFashionResults(data.recommendations);
  };

  const getTravelSuggestions = async (e) => {
    e.preventDefault();
    if (!theme.trim()) return;
    const data = await apiPost("/api/travel", {
      theme,
      location: travelLocation,
      model: selectedModel,
    });
    if (data?.ok) setTravelResults(data.recommendations);
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
        <option value="anthropic/claude-3-sonnet">
          Claude 3 Sonnet (Balanced)
        </option>
        <option value="anthropic/claude-3-opus">Claude 3 Opus (Best)</option>
        <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="openai/gpt-4">GPT-4</option>
        <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B</option>
        <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
        <option value="google/gemini-pro">Gemini Pro</option>
        <option value="mistralai/mistral-7b-instruct">Mistral 7B</option>
        <option value="microsoft/wizardlm-2-8x22b">WizardLM 2 8x22B</option>
        {availableModels.map((model) => (
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
            onChange={(e) => setGenre(e.target.value)}
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
            onChange={(e) => setTake(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search Movies"}
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
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="What kind of movies do you want to watch tonight?"
            rows="3"
          />
        </div>
        <button type="submit" disabled={loading || !chatMessage.trim()}>
          {loading ? "Thinking..." : "Send Message"}
        </button>
      </form>

      {chatHistory.length > 0 && (
        <div className="chat-history">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`message ${msg.type}`}>
              <strong>{msg.type === "user" ? "You" : "AI"}:</strong>
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
            onChange={(e) => setAnalysisMovie(e.target.value)}
            placeholder="Enter movie title..."
          />
        </div>
        <div className="form-group">
          <label>Analysis Type:</label>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <option value="summary">Summary</option>
            <option value="review">Review</option>
            <option value="similar">Similar Movies</option>
          </select>
        </div>
        <button type="submit" disabled={loading || !analysisMovie.trim()}>
          {loading ? "Analyzing..." : "Analyze Movie"}
        </button>
      </form>

      {analysisResult && (
        <div className="analysis-result">
          <h3>Analysis Result:</h3>
          <div className="result-content">
            {analysisResult.split("\n").map((line, i) => (
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
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="comedy, action, sci-fi..."
          />
        </div>
        <div className="form-group">
          <label>Current Mood:</label>
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="relaxed, adventurous, thoughtful..."
          />
        </div>
        <button type="submit" disabled={loading || !preferences.trim()}>
          {loading ? "Generating..." : "Get Recommendations"}
        </button>
      </form>

      {recommendations && (
        <div className="recommendations-result">
          <h3>Your Personalized Recommendations:</h3>
          <div className="result-content">
            {recommendations.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDiningTab = () => {
    const fetchDiningRecommendations = async (e) => {
      e.preventDefault();
      const data = await apiPost("/api/dining", {
        cuisine,
        location,
      });
      if (data?.ok) {
        setDiningResults(data.items || []);
        setDiningNarrative(data.narrative || "");
      }
    };

    return (
      <div className="tab-content">
        <h2>🍽️ Dining Recommendations</h2>
        {renderModelSelector()}
        <form onSubmit={fetchDiningRecommendations} className="recommend-form">
          <div className="form-group">
            <label>Your Cuisine:</label>
            <input
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g. Italian, Japanese, Indian"
            />
          </div>
          <div className="form-group">
            <label>Your Location:</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, Delhi, Tokyo"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Finding Restaurants..." : "Get Dining Suggestions"}
          </button>
        </form>

        {diningNarrative && (
          <div className="recommendations-result">
            <h3>🍷 Suggested by AI:</h3>
            <p>{diningNarrative}</p>
          </div>
        )}

        {diningResults.length > 0 && (
          <div className="results">
            <h3>🍴 Recommended Restaurants ({diningResults.length})</h3>
            <div className="movie-grid">
              {diningResults.map((item, i) => (
                <div key={i} className="movie-card">
                  <h3>{item.name || "Unnamed"}</h3>
                  {item.location && <p>{item.location}</p>}
                  {item.description && <p>{item.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFashionTab = () => (
    <div className="tab-content">
      <h2>👗 Fashion Recommendations</h2>
      {renderModelSelector()}
      <form onSubmit={getFashionSuggestions}>
        <div className="form-group">
          <label>Your Style:</label>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g. casual, formal, streetwear"
          />
        </div>
        <button type="submit" disabled={loading || !style.trim()}>
          {loading ? "Styling..." : "Get Fashion Suggestions"}
        </button>
      </form>
      {fashionResults && (
        <div className="results">
          <p>{fashionResults}</p>
        </div>
      )}
    </div>
  );

  const renderTravelTab = () => (
    <div className="tab-content">
      <h2>✈️ Travel Recommendations</h2>
      {renderModelSelector()}
      <form onSubmit={getTravelSuggestions}>
        <div className="form-group">
          <label>Your Travel Theme:</label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. beach, mountain, historic"
          />
        </div>
        <div className="form-group">
          <label>Your Location:</label>
          <input
            value={travelLocation}
            onChange={(e) => setTravelLocation(e.target.value)}
            placeholder="e.g. New York, Mumbai, Tokyo"
          />
        </div>

        <button type="submit" disabled={loading || !theme.trim()}>
          {loading ? "Planning..." : "Get Travel Ideas"}
        </button>
      </form>
      {travelResults && (
        <div className="results">
          <p>{travelResults}</p>
        </div>
      )}
    </div>
  );

  const renderDebugConsole = () => (
    <div className="debug-console">
      <div className="debug-header">
        <h3>🔍 Debug Console</h3>
        <button onClick={fetchDebugLogs} className="debug-btn">
          🔄 Refresh
        </button>
      </div>
      <div className="debug-logs">
        {debugLogs.map((log) => (
          <div
            key={log.id}
            className="debug-log-entry"
            style={getLogTypeStyle(log.type)}
          >
            <div className="log-header">
              <span className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
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
      info: { color: "#3498db", background: "#ebf3fd" },
      success: { color: "#27ae60", background: "#eafaf1" },
      error: { color: "#e74c3c", background: "#fdebea" },
      warning: { color: "#f39c12", background: "#fef5e7" },
    };
    return styles[type] || styles.info;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 OpenRouter-Powered Movie Recommendation System</h1>
        <p>Access to 280+ AI Models via OpenRouter</p>
        <div className="models-info">
          <small>
            Available Models: {availableModels.length} | Current:{" "}
            {selectedModel}
          </small>
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={activeTab === "dining" ? "active" : ""}
          onClick={() => setActiveTab("dining")}
        >
          🍽️ Dining
        </button>
        <button
          className={activeTab === "fashion" ? "active" : ""}
          onClick={() => setActiveTab("fashion")}
        >
          👗 Fashion
        </button>
        <button
          className={activeTab === "travel" ? "active" : ""}
          onClick={() => setActiveTab("travel")}
        >
          ✈️ Travel
        </button>

        <button
          className={activeTab === "search" ? "active" : ""}
          onClick={() => setActiveTab("search")}
        >
          🔍 Search
        </button>
        <button
          className={activeTab === "chat" ? "active" : ""}
          onClick={() => setActiveTab("chat")}
        >
          💬 AI Chat
        </button>
        <button
          className={activeTab === "analysis" ? "active" : ""}
          onClick={() => setActiveTab("analysis")}
        >
          🎯 Analysis
        </button>
        <button
          className={activeTab === "recommend" ? "active" : ""}
          onClick={() => setActiveTab("recommend")}
        >
          ⭐ Recommend
        </button>
        <button
          className={`tab-btn ${showDebugConsole ? "active" : ""}`}
          onClick={() => setShowDebugConsole(!showDebugConsole)}
        >
          🔧 Debug
        </button>
      </nav>

      <main className="main-content">
        {activeTab === "dining" && renderDiningTab()}
        {activeTab === "fashion" && renderFashionTab()}
        {activeTab === "travel" && renderTravelTab()}

        {activeTab === "search" && renderSearchTab()}
        {activeTab === "chat" && renderChatTab()}
        {activeTab === "analysis" && renderAnalysisTab()}
        {activeTab === "recommend" && renderRecommendTab()}

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
                  <h3>{movie.title || movie.name || "Untitled"}</h3>
                  {movie.year && <p className="year">({movie.year})</p>}
                  {movie.description && (
                    <p className="description">{movie.description}</p>
                  )}
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
