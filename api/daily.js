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

// =======================
// REGIONAL NEWS
// =======================

let regional = [];

try {
  const regionalRes = await fetch(
    `https://gnews.io/api/v4/search?q=Schwäbisch Hall OR Crailsheim OR Ilshofen OR Hohenlohe&lang=de&max=5&sortby=publishedAt&token=${process.env.GNEWS_KEY}`
  );

  const regionalData = await regionalRes.json();

  if (regionalData.articles) {
    regional = regionalData.articles.slice(0, 3);
  }
} catch (e) {
  regional = [];
}


// =======================
// EVENTS (kuratiert)
// =======================

   
/* ===============================
   NEWS SCORING (Professionelle Gewichtung)
================================= */
function scoreArticle(article) {
  let score = 0;

  const text = (article.title || "").toLowerCase();
  const source = (article.source || "").toLowerCase();
  const now = Date.now();

  // 1️⃣ HARTE EREIGNISSE (Top-Priorität)
  const crisisKeywords = [
    "krieg", "angriff", "iran", "israel", "ukraine",
    "wahl", "regierung", "sanktion", "explosion",
    "erdbeben", "unwetter"
  ];
  crisisKeywords.forEach(k => {
    if (text.includes(k)) score += 8;
  });

  // 2️⃣ MARKTBEZUG
  const marketKeywords = [
    "dax", "dow", "wall street", "börse",
    "zins", "ezb", "fed", "öl", "gas",
    "inflation", "rezession", "usd", "dollar"
  ];
  marketKeywords.forEach(k => {
    if (text.includes(k)) score += 6;
  });

  // 3️⃣ REGIONALE RELEVANZ
  if (text.includes("deutschland") || text.includes("bundestag"))
    score += 4;
  else if (text.includes("eu") || text.includes("europa"))
    score += 3;
  else
    score += 1;

  // 4️⃣ QUELLENQUALITÄT
  if (
    source.includes("bbc") ||
    source.includes("tagesschau") ||
    source.includes("zdf") ||
    source.includes("zeit") ||
    source.includes("faz")
  ) {
    score += 5;
  }
  else if (
    source.includes("spiegel") ||
    source.includes("stern") ||
    source.includes("focus")
  ) {
    score += 3;
  }
  else if (source.includes("20 minuten")) {
    score -= 3;
  }

  // 5️⃣ AKTUALITÄT (wenn publish-Date vorhanden)
  if (article.publishedAt) {
    const ageHours = (now - new Date(article.publishedAt)) / (1000 * 60 * 60);
    if (ageHours < 3) score += 5;
    else if (ageHours < 12) score += 3;
    else if (ageHours < 24) score += 1;
  }

  return score;
}

// ============================
// EVENTS (echtes Datumsmodell)
// ============================

let events = [

  // EINMALIGE EVENTS
  {
    title: "Haller Frühling",
    city: "Schwäbisch Hall",
    start: "2026-04-10",
    end: "2026-04-12",
    location: "Altstadt Schwäbisch Hall"
  },
  {
    title: "Jakobimarkt",
    city: "Schwäbisch Hall",
    start: "2026-07-18",
    end: "2026-07-18",
    location: "Innenstadt SHA"
  },
  {
    title: "Sommernachtsfest",
    city: "Schwäbisch Hall",
    start: "2026-08-15",
    end: "2026-08-16",
    location: "Altstadt SHA"
  },
  {
    title: "Haller Herbst",
    city: "Schwäbisch Hall",
    start: "2026-10-03",
    end: "2026-10-04",
    location: "Altstadt SHA"
  },
  {
    title: "Gartentage Langenburg",
    city: "Langenburg",
    start: "2026-05-01",
    end: "2026-05-03",
    location: "Schloss Langenburg"
  },

  // WOCHENMARKT (automatisch)
  {
    title: "Wochenmarkt Schwäbisch Hall",
    city: "Schwäbisch Hall",
    recurring: true,
    weekday: 6, // Samstag
    location: "Marktplatz Schwäbisch Hall"
  }

];

// ============================
// EVENT FILTER LOGIK
// ============================

function getWeekRange() {
  const now = new Date();
  const first = new Date(now);
  first.setDate(now.getDate() - now.getDay() + 1); // Montag
  first.setHours(0,0,0,0);

  const last = new Date(first);
  last.setDate(first.getDate() + 6); // Sonntag
  last.setHours(23,59,59,999);

  return { first, last };
}

function isInThisWeek(start, end) {
  const { first, last } = getWeekRange();
  const s = new Date(start);
  const e = new Date(end);
  return s <= last && e >= first;
}

function getRecurringDate(weekday) {
  const now = new Date();
  const { first, last } = getWeekRange();

  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === weekday) {
      return new Date(d);
    }
  }
  return null;
}

// FILTER ANWENDEN

events = events
  .map(event => {
    if (event.recurring) {
      const date = getRecurringDate(event.weekday);
      if (!date) return null;

      return {
        ...event,
        start: date.toISOString().split("T")[0],
        end: date.toISOString().split("T")[0]
      };
    }
    return event;
  })
  .filter(event => {
    if (!event) return false;
    return isInThisWeek(event.start, event.end);
  });
   
// ============================
// EVENTS (echtes Datumsmodell)
// ============================

let events = [

  // EINMALIGE EVENTS
  {
    title: "Haller Frühling",
    city: "Schwäbisch Hall",
    start: "2026-04-10",
    end: "2026-04-12",
    location: "Altstadt Schwäbisch Hall"
  },
  {
    title: "Jakobimarkt",
    city: "Schwäbisch Hall",
    start: "2026-07-18",
    end: "2026-07-18",
    location: "Innenstadt SHA"
  },
  {
    title: "Sommernachtsfest",
    city: "Schwäbisch Hall",
    start: "2026-08-15",
    end: "2026-08-16",
    location: "Altstadt SHA"
  },
  {
    title: "Haller Herbst",
    city: "Schwäbisch Hall",
    start: "2026-10-03",
    end: "2026-10-04",
    location: "Altstadt SHA"
  },
  {
    title: "Gartentage Langenburg",
    city: "Langenburg",
    start: "2026-05-01",
    end: "2026-05-03",
    location: "Schloss Langenburg"
  },

  // WOCHENMARKT (automatisch)
  {
    title: "Wochenmarkt Schwäbisch Hall",
    city: "Schwäbisch Hall",
    recurring: true,
    weekday: 6, // Samstag
    location: "Marktplatz Schwäbisch Hall"
  }

];

   
// ---------- EVENT FILTER LOGIK ----------

function getWeekRange() {
  const now = new Date();
  const first = new Date(now);
  first.setDate(now.getDate() - now.getDay() + 1); // Montag

  const last = new Date(first);
  last.setDate(first.getDate() + 6); // Sonntag

  return { first, last };
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const { first, last } = getWeekRange();
  const d = new Date(dateStr);
  return d >= first && d <= last;
}

function isFuture(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d > new Date();
}

// Beispiel: später echte Datumswerte nutzen
// aktuell nur vorbereitet – deine Events haben noch kein start/end

   
    /* =========================
       RESPONSE
    ========================== */

    const response = {
  version,
  timestamp,
  news: news,
  regional: regional,
  events: events,

  markets: {
  dax: {
    value: "18.742",
    date: "Stand: " + marketDate
  },
  eurusd: {
    value: "1.08",
    date: "Stand: " + marketDate
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
