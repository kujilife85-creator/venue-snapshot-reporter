const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/scrape', async (req, res) => {
  const venues = req.body;

  if (!Array.isArray(venues)) {
    return res.status(400).json({ error: 'Expected an array of venues.' });
  }

  const results = await Promise.all(venues.map(async (venue) => {
    if (!venue.url) return { ...venue, imageUrl: null, error: 'No URL provided' };

    try {
      const response = await axios.get(venue.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        },
        timeout: 8000
      });
      const html = response.data;
      const $ = cheerio.load(html);
      
      let imageUrl = $('meta[property="og:image"]').attr('content');
      
      if (!imageUrl) {
        imageUrl = $('img').first().attr('src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          try {
            const urlObj = new URL(venue.url);
            imageUrl = new URL(imageUrl, urlObj.origin).toString();
          } catch (e) {
            // Ignore URL parsing errors
          }
        }
      }

      return { ...venue, imageUrl: imageUrl || null };
    } catch (error) {
      console.error(`Failed to scrape ${venue.url}:`, error.message);
      return { ...venue, imageUrl: null, error: 'Failed to scrape image' };
    }
  }));

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
