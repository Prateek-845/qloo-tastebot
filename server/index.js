import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const QLOO_API_URL = process.env.QLOO_API_URL;
const QLOO_API_KEY = process.env.QLOO_API_KEY;
const PORT = process.env.PORT || 3001;

// Flexible route for any genre: /qloo/genre/:genre
app.get('/qloo/genre/:genre', async (req, res) => {
  const genre = req.params.genre.toLowerCase();
  const allowedGenres = ['romance', 'comedy', 'horror', 'thriller', 'fiction', 'drama'];
  if (!allowedGenres.includes(genre)) {
    return res.status(400).json({ error: `Genre "${genre}" not supported.` });
  }

  try {
    const qlooRes = await axios.get(QLOO_API_URL, {
      params: {
        'filter.type': 'urn:entity:movie',
        'filter.tags': `urn:tag:genre:media:${genre}`
      },
      headers: { 'x-api-key': QLOO_API_KEY }
    });
    const results = qlooRes.data?.results?.entities || [];
    res.json({ genre, movies: results });
  } catch (err) {
    res.status(500).json({
      error: err.response?.data || err.message || 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
