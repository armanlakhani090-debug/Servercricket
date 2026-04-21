const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CRICKET_API_KEY;

// ---------- CACHE ----------
let liveIPL = [];
let upcomingAll = [];
let matchCache = {}; // { id: {detail, score, players} }

// ---------- HELPERS ----------
function isIPL(m) {
  return (
    m.name?.toLowerCase().includes("ipl") ||
    m.series_name?.toLowerCase().includes("indian premier league")
  );
}

async function get(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch {
    return { data: [] };
  }
}

// ---------- MAIN UPDATE (30 sec) ----------
async function updateMain() {
  const data = await get(
    `https://api.cricketdata.org/v1/currentMatches?apikey=${API_KEY}`
  );

  const list = data.data || [];

  // IPL LIVE ONLY
  liveIPL = list.filter(
    m => isIPL(m) && m.status?.toLowerCase().includes("live")
  );

  // UPCOMING ALL
  upcomingAll = list.filter(
    m => m.status?.toLowerCase().includes("not started")
  );

  console.log("Main updated");
}

// ---------- LIVE DETAILS (15 sec only IPL) ----------
async function updateDetails() {
  for (const m of liveIPL) {
    const id = m.id;

    const detail = await get(
      `https://api.cricketdata.org/v1/match_info?apikey=${API_KEY}&id=${id}`
    );

    const score = await get(
      `https://api.cricketdata.org/v1/scorecard?apikey=${API_KEY}&id=${id}`
    );

    const players = await get(
      `https://api.cricketdata.org/v1/players?apikey=${API_KEY}&id=${id}`
    );

    matchCache[id] = {
      detail,
      score,
      players
    };
  }

  console.log("Details updated");
}

// ---------- INTERVAL ----------
setInterval(updateMain, 30000);     // 30 sec
setInterval(updateDetails, 15000);  // 15 sec

updateMain();
updateDetails();

// ---------- ROUTES ----------
app.get("/", (req, res) => {
  res.send("ScoreX FINAL Server Running 🚀");
});

// IPL LIVE
app.get("/live", (req, res) => {
  res.json(liveIPL);
});

// ALL UPCOMING
app.get("/upcoming", (req, res) => {
  res.json(upcomingAll);
});

// MATCH DETAIL
app.get("/match/:id", (req, res) => {
  const id = req.params.id;
  res.json(matchCache[id] || { msg: "Loading..." });
});

app.listen(PORT, () => console.log("Server started"));
