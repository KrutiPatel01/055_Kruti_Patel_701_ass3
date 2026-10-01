// Q6 - Free API utility: Weather lookup using Open-Meteo (free, no API key needed)
//   https://open-meteo.com/
// The same API is called two ways:
//   1) directly from the browser (frontend)   -> public/app.js
//   2) from this Express server (backend)     -> GET /api/weather?city=Surat
// Node 18+ has fetch built in, so no extra HTTP library is needed.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5006;

app.use(express.static(path.join(__dirname, 'public')));

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// Weather codes used by Open-Meteo -> readable text
const WEATHER_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
};

// GET /api/weather?city=Surat
app.get('/api/weather', async (req, res) => {
  const city = String(req.query.city || '').trim();
  if (!city) return res.status(400).json({ message: 'Please provide a city name.' });

  try {
    // Step 1: city name -> latitude/longitude
    const geoRes = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1`);
    if (!geoRes.ok) throw new Error('Geocoding service returned ' + geoRes.status);
    const geo = await geoRes.json();
    if (!geo.results || geo.results.length === 0) {
      return res.status(404).json({ message: `City "${city}" not found.` });
    }
    const place = geo.results[0];

    // Step 2: coordinates -> current weather
    const params = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code',
      timezone: 'auto'
    });
    const wRes = await fetch(`${WEATHER_URL}?${params}`);
    if (!wRes.ok) throw new Error('Weather service returned ' + wRes.status);
    const w = await wRes.json();

    res.json({
      source: 'Express backend',
      city: place.name,
      country: place.country,
      temperature: w.current.temperature_2m,
      feelsLike: w.current.apparent_temperature,
      humidity: w.current.relative_humidity_2m,
      windSpeed: w.current.wind_speed_10m,
      condition: WEATHER_CODES[w.current.weather_code] || 'Unknown',
      units: w.current_units,
      time: w.current.time
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ message: 'Could not fetch weather right now: ' + err.message });
  }
});

app.listen(PORT, () => console.log(`Weather utility running at http://localhost:${PORT}`));
