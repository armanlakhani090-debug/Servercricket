// Simple Cricket API proxy server for Render
// Caches CricketData.org responses to save your API quota

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

// ====== CONFIG ======
// Set this in Render dashboard → Environment → CRICKET_API_KEY
const API_KEY = process.env.CRICKET_API_KEY || "b065dbfe-1f25-44cd-b4a5-793ff1c69d88";
const BASE_URL = "https://api.cricapi.com/v1";

// Cache durations (ms)
const CACHE_TTL = {
  cricScore: 15 * 1000,        // 15s for live scores
  currentMatches: 20 * 1000,   // 20s
  matches: 60 * 1000,          // 60s
  match_info: 20 * 1000,       // 20s
  match_squad: 5 * 60 * 1000,  // 5 min
  match_bbb: 15 * 1000,        // 15s ball-by-ball
  series: 10 * 60 * 1000,      // 10 min
  default: 30 * 1000,
};

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());

// ====== IN-MEMORY CACHE ======
const cache = new Map();

function getCacheKey(endpoint, params) {
  const sorted = Object.keys(params || {}).sort().map(k => `${k}=${params[k]}`).join("&");
  return `${endpoint}?${sorted}`;
}

function getTTL(endpoint) {
  return CACHE_TTL[endpoint] || CACHE_TTL.default;
}

// ====== PROXY HANDLER ======
async function proxyCricket(endpoint, query) {
  const params = { ...query };
  delete params._ts; // strip cache-busters from client

  const key = getCacheKey(endpoint, params);
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.time < getTTL(endpoint)) {
    return { data: cached.data, fromCache: true };
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("apikey", API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Upstream ${endpoint} ${res.status}`);
  }

  const data = await res.json();
  cache.set(key, { data, time: now });
  return { data, fromCache: false };
}

// ====== ROUTES ======
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "cricket-proxy",
    endpoints: [
      "/api/cricScore",
      "/api/currentMatches",
      "/api/matches",
      "/api/match_info?id=...",
      "/api/match_squad?id=...",
      "/api/match_bbb?id=...",
      "/api/series",
      "/api/series_info?id=...",
    ],
    cacheSize: cache.size,
  });
});

app.get("/health", (_req, res) => res.json({ ok: true, time: Date.now() }));

// Generic catch-all proxy: /api/<endpoint>
app.get("/api/:endpoint", async (req, res) => {
  try {
    const { endpoint } = req.params;
    const result = await proxyCricket(endpoint, req.query);
    res.set("X-Cache", result.fromCache ? "HIT" : "MISS");
    res.json(result.data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(502).json({ status: "failure", message: err.message });
  }
});

// Clear cache manually (optional)
app.post("/cache/clear", (_req, res) => {
  cache.clear();
  res.json({ ok: true, cleared: true });
});

app.listen(PORT, () => {
  console.log(`Cricket proxy running on port ${PORT}`);
});
