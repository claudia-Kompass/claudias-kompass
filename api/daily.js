module.exports = async function handler(req, res) {
  try {
    const version = "19.4.2";
    const now = new Date();
    const timestamp = now.toLocaleString("de-DE");
    const marketDate = now.toLocaleDateString("de-DE");

    /* =========================
       HELPER
    ========================== */

    function normalizeTitle(title) {
      return (title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, "");
    }

    function parseRSS(xml, sourceName = "RSS") {
  const items = [];
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  matches.forEach(item => {
    const titleMatch = item.match(/<title>(.*?)<\/title>/);
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1]
          .replace(/<!\[CDATA\[(.*?)\]\]>/, "$1")
          .trim(),
        description: descMatch
          ? descMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, "$1")
              .replace(/<[^>]+>/g, "")
              .trim()
          : "",
        url: linkMatch[1].trim(),
        source: sourceName
      });
    }
  });

  return items;
}

    function topicKey(title){
      const t = (title || "").toLowerCase();
      if(t.includes("iran")) return "iran";
      if(t.includes("israel")) return "israel";
      if(t.includes("ukraine")) return "ukraine";
      if(t.includes("china")) return "china";
      if(t.includes("dax")) return "dax";
      if(t.includes("inflation")) return "inflation";
      if(t.includes("bundestag")) return "deutschland";
      return "other";
    }

    function scoreArticle(article) {
      let score = 0;
      const text = (article.title || "").toLowerCase();
      const source = (article.source || "").toLowerCase();

      ["krieg","iran","israel","ukraine","wahl","angriff","explosion","unwetter"]
        .forEach(k => { if (text.includes(k)) score += 8; });

      ["dax","börse","zins","ezb","fed","inflation","öl","gas","usd","dollar"]
        .forEach(k => { if (text.includes(k)) score += 6; });

      if (
        source.includes("tagesschau") ||
        source.includes("zdf") ||
        source.includes("bbc") ||
        source.includes("faz")
      ) score += 5;

      return score;
    }

    /* =========================
       CRYPTO
    ========================== */

    let bitcoin = { usd: 0, eur: 0, usd_24h_change: 0 };
    let nexo = { usd: 0, eur: 0, usd_24h_change: 0 };

    try {
      const cryptoRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true"
      );
      const cryptoData = await cryptoRes.json();
      if (cryptoData.bitcoin) bitcoin = cryptoData.bitcoin;
      if (cryptoData.nexo) nexo = cryptoData.nexo;
    } catch {}

    /* =========================
       WETTER
    ========================== */

    let currentTemp = 0;
    let currentCode = 0;

    try {
      const weatherRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true"
      );
      const weatherData = await weatherRes.json();
      currentTemp = weatherData.current_weather?.temperature ?? 0;
      currentCode = weatherData.current_weather?.weathercode ?? 0;
    } catch {}

/* =========================
   GLOBAL NEWS (GNews + RSS Fallback)
========================= */

let news = [];

try {

  let prepared = [];

  // --- 1️⃣ GNEWS ---
  if (process.env.GNEWS_KEY) {
    try {
      const newsRes = await fetch(
        `https://gnews.io/api/v4/top-headlines?country=de&lang=de&max=10&token=${process.env.GNEWS_KEY}`
      );

      if (newsRes.ok) {
        const newsJson = await newsRes.json();

        if (newsJson.articles && newsJson.articles.length > 0) {
          prepared = newsJson.articles.map(a => ({
            title: a.title,
            source: a.source?.name || "",
            url: a.url,
            topic: topicKey(a.title),
            score: scoreArticle(a)
          }));
        }
      }
    } catch {}
  }

  // --- 2️⃣ RSS FALLBACK ---
  if (prepared.length === 0) {

    const rssSources = [
      { url: "https://www.tagesschau.de/xml/rss2/", name: "Tagesschau" },
      { url: "https://www.spiegel.de/schlagzeilen/tops/index.rss", name: "Spiegel" }
    ];

    let rssArticles = [];

    for (const src of rssSources) {
      try {
        const r = await fetch(src.url);
        const text = await r.text();
        rssArticles = rssArticles.concat(parseRSS(text, src.name));
      } catch {}
    }

    prepared = rssArticles.map(a => ({
      ...a,
      topic: topicKey(a.title),
      score: scoreArticle(a)
    }));
  }

  // --- 3️⃣ Dedupe + Sort ---
  prepared = prepared
    .filter((article, index, self) =>
      index === self.findIndex(a =>
        normalizeTitle(a.title) === normalizeTitle(article.title)
      )
    )
    .sort((a, b) => b.score - a.score);

  const clustered = prepared.reduce((acc, curr) => {
    if (!acc.find(a => a.topic === curr.topic)) acc.push(curr);
    return acc;
  }, []);

  news = (clustered.length > 0 ? clustered : prepared)
    .slice(0, 5)
    .map(({ score, topic, ...rest }) => rest);

} catch {
  news = [];
}


/* =========================
   REGIONAL – STABIL
========================= */

let regional = [];

try {

  const sources = [
    { url: "https://www.swp.de/rss.xml", name: "SWP" }
  ];

  let collected = [];

  for (const src of sources) {
    try {
      const r = await fetch(src.url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (r.ok) {
        const text = await r.text();
        collected = collected.concat(parseRSS(text, src.name));
      }

    } catch {}
  }

  const allowedGeo = [
    "schwäbisch hall",
    "landkreis schwäbisch hall",
    "crailsheim",
    "gaildorf",
    "ilshofen"
  ];

  const regionalEntities = [
    "stadtwerke schwäbisch hall",
    "stadtwerke sha",
    "bausparkasse schwäbisch hall",
    "würth",
    "optima",
    "schubert",
    "recaro",
    "klafs",
    "bürger",
    "mittelstand"
  ];

  regional = collected.filter(a => {

    const t = (
      (a.title || "") + " " + (a.description || "")
    ).toLowerCase();

    const geoMatch = allowedGeo.some(g => t.includes(g));
    const entityMatch = regionalEntities.some(e => t.includes(e));

    return geoMatch || entityMatch;
  });

  regional = regional
    .filter((article, index, self) =>
      index === self.findIndex(a =>
        normalizeTitle(a.title) === normalizeTitle(article.title)
      )
    )
    .slice(0, 4);

} catch {
  regional = [];
}
  
      
    

    /* =========================
       RESPONSE
    ========================== */

    res.status(200).json({
      version,
      timestamp,
      news,
      regional,
      markets: {
        dax: { value: "18.742", date: "Stand: " + marketDate },
        eurusd: { value: "1.08", date: "Stand: " + marketDate }
      },
      crypto: {
        bitcoin,
        nexo
      },
      weather: {
        temp: currentTemp,
        code: currentCode
      }
    });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "API Fehler" });
  }
};
