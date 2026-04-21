const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CRICKET_API_KEY;

// SAFE FETCH
async function getData(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch {
    return { data: [] };
  }
}

// IPL FILTER
function isIPL(match) {
  return (
    match.name?.toLowerCase().includes("ipl") ||
    match.series_name?.toLowerCase().includes("ipl")
  );
}

// HOME
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// LIVE IPL
app.get("/live", async (req, res) => {
  const data = await getData(
    `https://api.cricketdata.org/v1/currentMatches?apikey=${API_KEY}`
  );

  const ipl = (data.data || []).filter(isIPL);

  res.json(ipl);
});

// UPCOMING ALL
app.get("/upcoming", async (req, res) => {
  const data = await getData(
    `https://api.cricketdata.org/v1/matches?apikey=${API_KEY}`
  );

  res.json(data.data || []);
});

// MATCH DETAIL
app.get("/match/:id", async (req, res) => {
  const id = req.params.id;

  const data = await getData(
    `https://api.cricketdata.org/v1/match_info?apikey=${API_KEY}&id=${id}`
  );

  res.json(data);
});

app.listen(PORT, () => console.log("Server running"));
