const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CRICKET_API_KEY;

let cache = {
  live: [],
  upcoming: [],
  recent: []
};

// 🔁 FETCH + SMART CLASSIFICATION
async function updateData() {
  try {
    const res = await fetch(`https://api.cricketdata.org/v1/currentMatches?apikey=${API_KEY}&offset=0`);
    const json = await res.json();

    if (!json || !json.data) return;

    const now = new Date();

    const live = [];
    const upcoming = [];
    const recent = [];

    json.data.forEach(m => {
      const status = (m.status || "").toLowerCase();
      const date = new Date(m.dateTimeGMT || m.dateTime || 0);

      // 🔴 LIVE DETECT (MOST IMPORTANT FIX)
      if (
        status.includes("live") ||
        status.includes("innings") ||
        (m.score && m.score.length > 0 && !status.includes("completed"))
      ) {
        live.push(m);
      }

      // 🟢 UPCOMING
      else if (
        date > now ||
        status.includes("not started") ||
        status.includes("scheduled") ||
        status.includes("fixture")
      ) {
        upcoming.push(m);
      }

      // 🔵 RECENT
      else {
        recent.push(m);
      }
    });

    cache.live = live;
    cache.upcoming = upcoming;
    cache.recent = recent;

    console.log("✅ Updated:", {
      live: live.length,
      upcoming: upcoming.length,
      recent: recent.length
    });

  } catch (e) {
    console.log("❌ API Error", e.message);
  }
}

// ⏱ 5 सेकंड refresh
setInterval(updateData, 5000);
updateData();

// ROUTES

app.get("/", (req, res) => {
  res.send("ScoreX Server Running 🚀");
});

app.get("/live", (req, res) => {
  res.json(cache.live.length ? cache.live : { message: "No live matches right now" });
});

app.get("/upcoming", (req, res) => {
  res.json(cache.upcoming.length ? cache.upcoming : { message: "No upcoming matches right now" });
});

app.get("/recent", (req, res) => {
  res.json(cache.recent.length ? cache.recent : { message: "No recent matches" });
});

// MATCH DETAILS
app.get("/match/:id", async (req, res) => {
  try {
    const r = await fetch(`https://api.cricketdata.org/v1/match_info?apikey=${API_KEY}&id=${req.params.id}`);
    const data = await r.json();
    res.json(data.data || { message: "No match data" });
  } catch {
    res.json({ message: "Error fetching match" });
  }
});

app.listen(PORT, () => console.log("🚀 Server running"));
