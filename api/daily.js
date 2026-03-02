 module.exports = async function handler(req, res) {
  try {
    const version = "19.2.0";
    const now = new Date();
    const timestamp = now.toLocaleString("de-DE");
const mrketDate = now.toLocaleDateString("de-DE");

   
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


const today = new Date();
const currentYear = today.getFullYear();

// ==========================
// EVENTS – SAUBERES MODELL
// ==========================

// Wochenstart (Montag)
const day = today.getDay();
const diffToMonday = (day === 0 ? -6 : 1) - day;

const monday = new Date(today);
monday.setDate(today.getDate() + diffToMonday);
monday.setHours(0, 0, 0, 0);

// Wochenende (Sonntag)
const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

// ===== JÄHRLICHE EVENTS =====
const yearlyEvents = [
  {
    title: "Haller Frühling",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 3, 10),
    end: new Date(currentYear, 3, 12),
    location: "Altstadt Schwäbisch Hall"
  },
  {
    title: "Jakobimarkt",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 6, 18),
    end: new Date(currentYear, 6, 18),
    location: "Innenstadt SHA"
  },
  {
    title: "Sommernachtsfest",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 7, 15),
    end: new Date(currentYear, 7, 16),
    location: "Altstadt SHA"
  },
  {
    title: "Haller Herbst",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 9, 3),
    end: new Date(currentYear, 9, 4),
    location: "Altstadt SHA"
  },
  {
    title: "Gartentage Langenburg",
    city: "Langenburg",
    start: new Date(currentYear, 4, 1),
    end: new Date(currentYear, 4, 3),
    location: "Schloss Langenburg"
  }
];

// ===== WOCHENMÄRKTE (dynamisch) =====
const weeklyEvents = [];

// Mittwoch SHA
if (day <= 3) {
  weeklyEvents.push({
    title: "Wochenmarkt",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, today.getMonth(), today.getDate()),
    end: new Date(currentYear, today.getMonth(), today.getDate()),
    location: "Marktplatz Schwäbisch Hall"
  });
}

// Samstag Crailsheim
if (day <= 6) {
  weeklyEvents.push({
    title: "Wochenmarkt",
    city: "Crailsheim",
    start: new Date(currentYear, today.getMonth(), today.getDate()),
    end: new Date(currentYear, today.getMonth(), today.getDate()),
    location: "Innenstadt Crailsheim"
  });
}

// ===== FILTER NUR AKTUELLE WOCHE =====
let events = [...yearlyEvents, ...weeklyEvents].filter(e =>
  e.start <= sunday && e.end >= monday
);

// ===== FORMATIEREN FÜR API =====
events = events.map(e => ({
  title: e.title,
  city: e.city,
  date: e.start.toLocaleDateString("de-DE"),
  location: e.location
}));
   
// Wochenstart (Montag)
const day = today.getDay();
const diffToMonday = (day === 0 ? -6 : 1) - day;
const monday = new Date(today);
monday.setDate(today.getDate() + diffToMonday);
monday.setHours(0,0,0,0);

// Wochenende (Sonntag)
const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23,59,59,999);

// ===== JÄHRLICHE HIGHLIGHTS =====
let yearlyEvents = [
  {
    title: "Haller Frühling",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 3, 10),
    end: new Date(currentYear, 3, 12),
    location: "Altstadt Schwäbisch Hall"
  },
  {
    title: "Jakobimarkt",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 6, 18),
    end: new Date(currentYear, 6, 18),
    location: "Innenstadt SHA"
  },
  {
    title: "Sommernachtsfest",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 7, 15),
    end: new Date(currentYear, 7, 16),
    location: "Altstadt SHA"
  },
  {
    title: "Haller Herbst",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, 9, 3),
    end: new Date(currentYear, 9, 4),
    location: "Altstadt SHA"
  },
  {
    title: "Gartentage Langenburg",
    city: "Langenburg",
    start: new Date(currentYear, 4, 1),
    end: new Date(currentYear, 4, 3),
    location: "Schloss Langenburg"
  }
];

// ===== WOCHENMARKT REGEL =====
let weeklyEvents = [];

const weekday = today.getDay();

// Mittwoch Markt SHA
if (weekday <= 3) {
  weeklyEvents.push({
    title: "Wochenmarkt",
    city: "Schwäbisch Hall",
    start: new Date(currentYear, today.getMonth(), today.getDate()),
    end: new Date(currentYear, today.getMonth(), today.getDate()),
    location: "Marktplatz SHA"
  });
}

// Samstag Markt Crailsheim
if (weekday <= 6) {
  weeklyEvents.push({
    title: "Wochenmarkt",
    city: "Crailsheim",
    start: new Date(currentYear, today.getMonth(), today.getDate()),
    end: new Date(currentYear, today.getMonth(), today.getDate()),
    location: "Innenstadt Crailsheim"
  });
}

// ===== FILTER NUR AKTUELLE WOCHE =====
let events = [...baseEvents, ...weeklyEvents].filter(e =>
  e.start <= sunday && e.end >= monday
);

// Formatieren
events = events.map(e => ({
  title: e.title,
  city: e.city,
  date: e.start.toLocaleDateString("de-DE"),
  location: e.location
}));
   
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


