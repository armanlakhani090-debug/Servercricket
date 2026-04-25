const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CRICKET_API_KEY;

// 🔥 CACHE
let liveMatches = [];
let upcomingMatches = [];
let recentMatches = [];

// 🧠 FETCH FUNCTION
async function fetchData() {
  try {
    const res = await fetch(`https://api.cricketdata.org/v1/matches?apikey=${API_KEY}`);
    const data = await res.json();

    if (!data || !data.data) return;

    const matches = data.data;

    // 🔴 LIVE
    liveMatches = matches.filter(m =>
      m.status && m.status.toLowerCase().includes("live")
    );

    // 🟢 UPCOMING
    upcomingMatches = matches.filter(m =>
      m.status === "Match not started"
    );

    // 🔵 RECENT
    recentMatches = matches.filter(m =>
      m.status && m.status.toLowerCase().includes("completed")
    );

    console.log("✅ Data updated");
  } catch (err) {
    console.log("❌ API Error");
  }
}

// 🔁 AUTO REFRESH (5 sec)
setInterval(fetchData, 5000);

// FIRST LOAD
fetchData();

// 📍 ROUTES

app.get("/", (req, res) => {
  res.send("ScoreX Server Running 🚀");
});

app.get("/live", (req, res) => {
  if (!liveMatches.length) return res.json({ message: "Data loading..." });
  res.json(liveMatches);
});

app.get("/upcoming", (req, res) => {
  if (!upcomingMatches.length) return res.json({ message: "Data loading..." });
  res.json(upcomingMatches);
});

app.get("/recent", (req, res) => {
  if (!recentMatches.length) return res.json({ message: "Data loading..." });
  res.json(recentMatches);
});

// 🔍 MATCH DETAILS
app.get("/match/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const r = await fetch(`https://api.cricketdata.org/v1/match_info?apikey=${API_KEY}&id=${id}`);
    const data = await r.json();

    if (!data || !data.data) return res.json({ message: "Data loading..." });

    res.json(data.data);
  } catch {
    res.json({ message: "Data loading..." });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
