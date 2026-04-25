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
  } catch {
    return null;
  }
}

// 🔄 UPDATE ALL DATA
async function updateData() {
  try {
    const data = await safeFetch(
      `https://api.cricketdata.org/v1/currentMatches?apikey=${API_KEY}&offset=0`
    );

    if (!data || !data.data) return;

    const matches = data.data;

    // 🔴 LIVE
    cache.live = matches.filter(m =>
      m.status &&
      (
        m.status.toLowerCase().includes("live") ||
        m.status.toLowerCase().includes("innings")
      )
    );

    // 🟢 UPCOMING
    cache.upcoming = matches.filter(m =>
      m.status &&
      (
        m.status.toLowerCase().includes("not started") ||
        m.status.toLowerCase().includes("scheduled") ||
        m.status.toLowerCase().includes("fixture")
      )
    );

    // 🔵 RECENT
    cache.recent = matches.filter(m =>
      m.status &&
      (
        m.status.toLowerCase().includes("completed") ||
        m.status.toLowerCase().includes("result")
      )
    );

    cache.lastUpdate = Date.now();

    console.log("✅ Updated:", {
      live: cache.live.length,
      upcoming: cache.upcoming.length,
      recent: cache.recent.length
    });

  } catch {
    console.log("❌ Update error");
  }
}

// ⏱ 5 SECOND REFRESH
setInterval(updateData, 5000);
updateData();

// 🏠 ROOT
app.get("/", (req, res) => {
  res.send("ScoreX Server Running 🚀");
});

// 🔴 LIVE
app.get("/live", (req, res) => {
  res.json(cache.live.length ? cache.live : { message: "No live matches" });
});

// 🟢 UPCOMING
app.get("/upcoming", (req, res) => {
  res.json(cache.upcoming.length ? cache.upcoming : { message: "No upcoming matches" });
});

// 🔵 RECENT
app.get("/recent", (req, res) => {
  res.json(cache.recent.length ? cache.recent : { message: "No recent matches" });
});

// 🔍 MATCH DETAILS (Scorecard + Info)
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

// 🗣 COMMENTARY (LIMITED BY API)
app.get("/commentary/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const data = await safeFetch(
      `https://api.cricketdata.org/v1/ball_by_ball?apikey=${API_KEY}&id=${id}`
    );

    if (!data || !data.data) {
      return res.json({ message: "No commentary available" });
    }

    res.json(data.data);

  } catch {
    res.json({ message: "Error fetching commentary" });
  }
});

// 🚀 START
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
