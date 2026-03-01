 module.exports = async function handler(req, res) {
  try {
    const version = "19.2.0";
    const now = new Date();
    const timestamp = now.toLocaleString("de-DE");
const marketDate = now.toLocaleDateString("de-DE");
   
    /* =========================
       KRYPTO (stabil + fallback)
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
    } catch (e) {
      // fallback bleibt 0
    }

    /* =========================
       WETTER (stabil)
    ========================== */

    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode"
    );

    const weatherData = await weatherRes.json();

    const currentTemp = weatherData.current_weather?.temperature ?? 0;
    const currentCode = weatherData.current_weather?.weathercode ?? 0;

    const hourly = weatherData.hourly;

    function getIndex(hour) {
      return hourly.time.findIndex(t =>
        t.includes(`T${hour.toString().padStart(2, "0")}:00`)
      );
    }

    const mI = getIndex(9);
    const aI = getIndex(15);
    const eI = getIndex(21);

    /* =========================
       NEWS (absolut crash-sicher)
    ========================== */

    let news = [];

    try {
      if (process.env.GNEWS_KEY) {
        const newsRes = await fetch(
  `https://gnews.io/api/v4/search?q=krieg OR iran OR israel OR ukraine OR russland OR wahl OR bundestag OR inflation OR zins OR dax OR öl OR gas&lang=de&max=10&sortby=publishedAt&token=${process.env.GNEWS_KEY}`
);
        const newsJson = await newsRes.json();

        news = (newsJson.articles || [])
  .map(a => {
    const article = {
      title: a.title,
      source: a.source?.name || "",
      url: a.url
    };

    return {
      ...article,
      score: scoreArticle(article)
    };
  })
.sort((a, b) => b.score - a.score)

// DOPPELTE TITEL ENTFERNEN
.filter((article, index, self) =>
  index === self.findIndex(a =>
    a.title.trim().toLowerCase() === article.title.trim().toLowerCase()
  )
)

.slice(0, 3) // max 3 Top-Themen
.map(({ score, ...rest }) => rest);
      } else {
        // Fallback Demo-News (läuft immer)
        news = [
          {
            title: "Bundestag diskutiert Haushaltsreform",
            source: "Tagesschau",
            url: "https://www.tagesschau.de"
          },
          {
            title: "EU berät über neue Sicherheitsstrategie",
            source: "n-tv",
            url: "https://www.n-tv.de"
          }
        ];
      }
    } catch (e) {
      news = [];
    }

/* ===============================
   NEWS SCORING (Professionelle Gewichtung)
================================= */

function scoreArticle(article) {
  let score = 0;
  const text = (article.title || "").toLowerCase();
  const source = (article.source || "").toLowerCase();

  // 1️⃣ Krisen / harte Nachrichten
  const crisisKeywords = [
    "krieg", "angriff", "explosion", "sanktion",
    "wahl", "erdbeben", "unwetter", "inflation",
    "zins", "ezb", "fed", "öl", "gas", "rezession"
  ];
  crisisKeywords.forEach(k => {
    if (text.includes(k)) score += 5;
  });

  // 2️⃣ Marktbezug
  const marketKeywords = [
    "dax", "dow", "wall street", "börse",
    "rendite", "wirtschaft", "china",
    "usd", "dollar", "euro"
  ];
  marketKeywords.forEach(k => {
    if (text.includes(k)) score += 4;
  });

  // 3️⃣ Regionale Einordnung
  if (text.includes("deutschland") || text.includes("bundestag")) score += 3;
  else if (text.includes("eu") || text.includes("europa")) score += 2;
  else score += 1;

  // 4️⃣ Quellengewichtung
  if (source.includes("bbc") || source.includes("tagesschau") || source.includes("zdf") || source.includes("reuters"))
    score += 3;
  else if (source.includes("n-tv") || source.includes("rtl"))
    score += 2;
  else
    score += 1;

  return score;
}

    /* =========================
       RESPONSE
    ========================== */

    const response = {
  version,
  timestamp,
  news: news,

  markets: {
        dax: {
          value: "18.742",
          date: "Stand aktuell"
        },
        eurusd: {
          value: "1.08",
          date: "Stand aktuell"
        }
      },

      crypto: {
        bitcoin: {
          usd: bitcoin.usd,
          eur: bitcoin.eur,
          change: bitcoin.usd_24h_change
        },
        nexo: {
          usd: nexo.usd,
          eur: nexo.eur,
          change: nexo.usd_24h_change
        }
      },

      weather: {
        temp: currentTemp,
        code: currentCode,
        trend: {
          morning: {
            temp: hourly.temperature_2m[mI] ?? 0,
            code: hourly.weathercode[mI] ?? 0
          },
          afternoon: {
            temp: hourly.temperature_2m[aI] ?? 0,
            code: hourly.weathercode[aI] ?? 0
          },
          evening: {
        temp: hourly.temperature_2m[eI] ?? 0,
        code: hourly.weathercode[eI] ?? 0
      }
    }
  }
};

res.status(200).json(response);

} catch (error) {
  console.error("API ERROR:", error);
  res.status(500).json({ error: "API Fehler" });
}
};
