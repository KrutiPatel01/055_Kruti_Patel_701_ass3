# Q6 — Free API utility (Weather, Open-Meteo)

A small weather lookup that uses the free **Open-Meteo** API (no API key, no signup) and calls it
in **two ways** so you can show both in the viva:

| Button | Flow |
|---|---|
| Fetch from Frontend | browser JS (`public/app.js`) → Open-Meteo directly |
| Fetch from Backend | browser JS → our Express route `GET /api/weather?city=...` → Open-Meteo |

## Folder structure
```
free-api-utility/
├── server.js          # Express server + /api/weather route (uses built-in fetch, Node 18+)
└── public/            # index.html, app.js (frontend calls), style.css
```

## Run
```bash
npm install
npm start
```
Open **http://localhost:5006**, type a city, and click either button.

## How it works
1. **Geocoding API** turns a city name into latitude/longitude.
2. **Forecast API** returns the current temperature, feels-like, humidity, wind and a weather code
   which is mapped to text such as "Partly cloudy".

## Viva notes
- Calling from the backend hides third-party URLs/keys from the browser, allows caching and
  avoids CORS problems. (Open-Meteo has no key, but with a keyed API you would *always* call from the backend.)
- Errors handled: empty city (400), unknown city (404), upstream failure (502).
