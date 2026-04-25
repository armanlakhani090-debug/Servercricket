const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CRICKET_API_KEY;

// 🔥 CACHE
let cache = {
  live: [],
  upcoming: [],
  recent: [],
  lastUpdate: 0
};

// 🧠 SAFE FETCH
async function safeFetch(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    return null;
  }
}

// 🔄 MAIN FETCH (EVERY 5 SEC)
async function updateData() {
  try {
    // ✅ CURRENT MATCHES (BEST ENDPOINT)
    const data = await safeFetch(
      `https://api.cricketdata.org/v1/currentMatches?apikey=${API_KEY}&offset=0`
    );

    if (!data || !data.data) return;

    const matches = data.data;

    // 🔴 LIVE
    cache.live = matches.filter(m =>
      m.status && m.status.toLowerCase().includes("live")
    );

    // 🟢 UPCOMING
    cache.upcoming = matches.filter(m =>
      m.status && m.status.toLowerCase().includes("not started")
    );

    // 🔵 RECENT
    cache.recent = matches.filter(m =>
      m.status && m.status.toLowerCase().includes("completed")
    );

    cache.lastUpdate = Date.now();

    console.log("✅ Updated:", {
      live: cache.live.length,
      upcoming: cache.upcoming.length,
      recent: cache.recent.length
    });

  } catch (e) {
    console.log("❌ Update error");
  }
}

// ⏱ AUTO REFRESH
setInterval(updateData, 5000);
updateData();

// 📍 ROUTES

app.get("/", (req, res) => {
  res.send("ScoreX Server Running 🚀");
});

app.get("/live", (req, res) => {
  if (!cache.live.length) {
    return res.json({ message: "No live matches right now" });
  }
  res.json(cache.live);
});

app.get("/upcoming", (req, res) => {
  if (!cache.upcoming.length) {
    return res.json({ message: "No upcoming matches" });
  }
  res.json(cache.upcoming);
});

app.get("/recent", (req, res) => {
  if (!cache.recent.length) {
    return res.json({ message: "No recent matches" });
  }
  res.json(cache.recent);
});

// 🔍 MATCH DETAILS (FULL)
app.get("/match/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const data = await safeFetch(
      `https://api.cricketdata.org/v1/match_info?apikey=${API_KEY}&id=${id}`
    );

    if (!data || !data.data) {
      return res.json({ message: "No match data" });
    }

    res.json(data.data);
  } catch {
    res.json({ message: "Error fetching match" });
  }
});

// 🚀 START
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
