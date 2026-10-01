// Frontend code. Two ways to get the same data:
//   fetchFromFrontend() -> the browser calls Open-Meteo directly (the API allows CORS)
//   fetchFromBackend()  -> the browser calls OUR Express route, which calls Open-Meteo

const cityInput = document.getElementById('city');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

const WEATHER_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
};

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (isError ? ' error' : '');
}

function show(data) {
  resultEl.innerHTML = `
    <table class="result-table">
      <tr><th>Fetched via</th><td>${data.source}</td></tr>
      <tr><th>Location</th><td>${data.city}, ${data.country || ''}</td></tr>
      <tr><th>Condition</th><td>${data.condition}</td></tr>
      <tr><th>Temperature</th><td>${data.temperature} ${data.units.temperature_2m}</td></tr>
      <tr><th>Feels like</th><td>${data.feelsLike} ${data.units.apparent_temperature}</td></tr>
      <tr><th>Humidity</th><td>${data.humidity} ${data.units.relative_humidity_2m}</td></tr>
      <tr><th>Wind speed</th><td>${data.windSpeed} ${data.units.wind_speed_10m}</td></tr>
      <tr><th>Observed at</th><td>${data.time}</td></tr>
    </table>`;
}

function getCity() {
  const city = cityInput.value.trim();
  if (!city) {
    setStatus('Please enter a city name.', true);
    return null;
  }
  return city;
}

// ---------- 1) direct call from the browser ----------
async function fetchFromFrontend() {
  const city = getCity();
  if (!city) return;
  setStatus('Loading (frontend call)...');
  resultEl.innerHTML = '';

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geo = await geoRes.json();
    if (!geo.results || geo.results.length === 0) throw new Error(`City "${city}" not found.`);
    const place = geo.results[0];

    const params = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code',
      timezone: 'auto'
    });
    const wRes = await fetch('https://api.open-meteo.com/v1/forecast?' + params);
    if (!wRes.ok) throw new Error('Weather service returned ' + wRes.status);
    const w = await wRes.json();

    setStatus('');
    show({
      source: 'Frontend (browser called the API directly)',
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
    setStatus(err.message, true);
  }
}

// ---------- 2) call through our own Express backend ----------
async function fetchFromBackend() {
  const city = getCity();
  if (!city) return;
  setStatus('Loading (backend call)...');
  resultEl.innerHTML = '';

  try {
    const res = await fetch('/api/weather?city=' + encodeURIComponent(city));
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    setStatus('');
    show({ ...data, source: 'Backend (Express called the API)' });
  } catch (err) {
    setStatus(err.message, true);
  }
}

document.getElementById('btnFront').addEventListener('click', fetchFromFrontend);
document.getElementById('btnBack').addEventListener('click', fetchFromBackend);
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchFromBackend();
});
