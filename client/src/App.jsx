import { useState } from "react";

function App() {
  const [genre, setGenre] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allowedGenres = ['romance', 'comedy', 'horror', 'thriller', 'fiction', 'drama'];

  async function fetchMovies(e) {
    e.preventDefault();
    setError("");
    setMovies([]);
    const trimmed = genre.trim().toLowerCase();
    if (!allowedGenres.includes(trimmed)) {
      setError(`Only these genres supported: ${allowedGenres.join(", ")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/qloo/genre/${trimmed}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setMovies(data.movies || []);
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  }

  return (
    <div style={{maxWidth:500,margin:"2rem auto",padding:24,borderRadius:12,boxShadow:"0 2px 16px #0001",background:"#fff"}}>
      <h2>Qloo Movie Search</h2>
      <form onSubmit={fetchMovies} style={{marginBottom:24}}>
        <input
          type="text"
          value={genre}
          onChange={e => setGenre(e.target.value)}
          placeholder="Type genre (e.g. romance)"
          style={{padding:8,marginRight:8}}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !genre.trim()}>Search</button>
      </form>
      {loading && <div>Loading...</div>}
      {error && <div style={{color:"crimson"}}>{error}</div>}
      {movies.length > 0 && (
        <div>
          <h3>Results:</h3>
          <ol>
            {movies.map((movie, i) => (
              <li key={i}>
                {movie.title || movie.name || movie.id}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default App;
