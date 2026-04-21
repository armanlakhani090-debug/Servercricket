const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CRICKET_API_KEY;

// IPL FILTER
function isIPL(match) {
  return (
    match.name?.toLowerCase().includes("ipl") ||
    match.series_name?.toLowerCase().includes("indian premier league")
  );
}

// HOME
app.get("/", (req, res) => {
  res.send("ScoreX PRO IPL Server 🚀");
});

// 🟢 LIVE IPL ONLY
app.get("/live", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.cricketdata.org/v1/currentMatches?apikey=${API_KEY}`
    );
    const data = await response.json();

    const iplMatches = (data.data || []).filter(isIPL);

    res.json(iplMatches);
  } catch {
    res.json({ error: "Live IPL Error ❌" });
  }
});

// 🟢 UPCOMING ALL
app.get("/upcoming", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.cricketdata.org/v1/matches?apikey=${API_KEY}`
    );
    const data = await response.json();

    res.json(data.data || []);
  } catch {
    res.json({ error: "Upcoming Error ❌" });
  }
});

// 🟢 MATCH DETAIL (TOSS + BASIC)
app.get("/match/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const response = await fetch(
      `https://api.cricketdata.org/v1/match_info?apikey=${API_KEY}&id=${id}`
    );

    const data = await response.json();

    res.json(data);
  } catch {
    res.json({ error: "Match Detail Error ❌" });
  }
});

// 🟢 SCORECARD
app.get("/scorecard/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const response = await fetch(
      `https://api.cricketdata.org/v1/scorecard?apikey=${API_KEY}&id=${id}`
    );

    const data = await response.json();

    res.json(data);
  } catch {
    res.json({ error: "Scorecard Error ❌" });
  }
});

// 🟢 PLAYERS
app.get("/players/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const response = await fetch(
      `https://api.cricketdata.org/v1/players?apikey=${API_KEY}&id=${id}`
    );

    const data = await response.json();

    res.json(data);
  } catch {
    res.json({ error: "Players Error ❌" });
  }
});

// 🟢 SQUAD
app.get("/squad/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const response = await fetch(
      `https://api.cricketdata.org/v1/squads?apikey=${API_KEY}&id=${id}`
    );

    const data = await response.json();

    res.json(data);
  } catch {
    res.json({ error: "Squad Error ❌" });
  }
});

// 🟢 COMMENTARY
app.get("/commentary/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const response = await fetch(
      `https://api.cricketdata.org/v1/commentary?apikey=${API_KEY}&id=${id}`
    );

    const data = await response.json();

    res.json(data);
  } catch {
    res.json({ error: "Commentary Error ❌" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
