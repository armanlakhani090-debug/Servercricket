const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CRICKET_API_KEY;

// CACHE
let liveIPL = [];
let upcomingAll = [];

// IPL FILTER
function isIPL(m) {
  return (
    m.name?.toLowerCase().includes("ipl") ||
    m.series_name?.toLowerCase().includes("indian premier league")
  );
}

// FETCH FUNCTION
async function updateData() {
  try {
    const r = await fetch(
      `https://api.cricketdata.org/v1/currentMatches?apikey=${API_KEY}`
    );
    const data = await r.json();

    const list = data.data || [];

    // LIVE IPL ONLY
    liveIPL = list.filter(
      m => isIPL(m) && m.status?.toLowerCase().includes("live")
    );

    // UPCOMING ALL
    upcomingAll = list.filter(
      m => m.status === "Match not started"
    );

    console.log("Updated ✅");

  } catch (err) {
    console.log("API Error ❌");
  }
}

// 🔥 हर 3 सेकंड update (fast feel)
setInterval(updateData, 3000);

// first load
updateData();

// ROUTES
app.get("/", (req, res) => {
  res.send("IPL Server Running 🚀");
});

app.get("/live", (req, res) => {
  res.json(liveIPL);
});

app.get("/upcoming", (req, res) => {
  res.json(upcomingAll);
});

app.listen(PORT, () => {
  console.log("Server started");
});
