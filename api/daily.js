module.exports = async function handler(req, res) {
  try {
    const version = "19.4.0";
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

function parseRSS(xml) {
  const items = [];
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  matches.forEach(item => {
    const titleMatch = item.match(/<title>(.*?)<\/title>/);
    const linkMatch = item.match(/<link>(.*?)<\/link>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1]
          .replace(/<!\[CDATA\[(.*?)\]\]>/, "$1")
          .trim(),
        url: linkMatch[1].trim(),
        source: "RSS"
      });
    }
  });

  return items;
}
    
    function scoreArticle(article) {
      let score = 0;
      const text = (article.title || "").toLowerCase();
      const source = (article.source || "").toLowerCase();

      const crisis = [
        "krieg","iran","israel","ukraine","wahl",
        "angriff","explosion","unwetter"
      ];
      crisis.forEach(k => {
        if (text.includes(k)) score += 8;
      });

      const market = [
        "dax","börse","zins","ezb","fed",
        "inflation","öl","gas","usd","dollar"
      ];
      market.forEach(k => {
        if (text.includes(k)) score += 6;
      });

      if (
        source.includes("tagesschau") ||
        source.includes("zdf") ||
        source.includes("bbc") ||
        source.includes("faz")
      ) score += 5;

      return score;
    }

    /* =========================
       KRYPTO
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
    } catch (e) {}

    /* =========================
       WETTER
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
   NEWS (Global)
========================== */

let news = [];

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

try {
  if (process.env.GNEWS_KEY) {

    // 1️⃣ Deutsche Top Headlines
    let newsRes = await fetch(
      `https://gnews.io/api/v4/top-headlines?country=de&lang=de&max=10&token=${process.env.GNEWS_KEY}`
    );

    let newsJson = await newsRes.json();

    // 2️⃣ Falls leer → Fallback Welt
    if (!newsJson.articles || newsJson.articles.length === 0) {
      newsRes = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=world&lang=de&max=10&token=${process.env.GNEWS_KEY}`
      );
      newsJson = await newsRes.json();
    }

    const prepared = (newsJson.articles || [])

      // Basisdaten
      .map(a => ({
        title: a.title,
        source: a.source?.name || "",
        url: a.url,
        topic: topicKey(a.title),
        score: scoreArticle({
          title: a.title,
          source: a.source?.name
        })
      }))

      // Titel-Deduplizierung
      .filter((article, index, self) =>
        index === self.findIndex(a =>
          normalizeTitle(a.title) === normalizeTitle(article.title)
        )
      )

      // Nach Relevanz
      .sort((a, b) => b.score - a.score);

    // 3️⃣ Pro Topic nur 1
    const clustered = prepared.reduce((acc, curr) => {
      if (!acc.find(a => a.topic === curr.topic)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // 4️⃣ Fallback falls zu stark gefiltert
    news = (clustered.length > 0 ? clustered : prepared)
      .slice(0, 5)
      .map(({ score, topic, ...rest }) => rest);
  }
} catch (e) {
  news = [];
}

/* =========================
   REGIONAL – Balanced C
========================== */

let regional = [];

try {
  if (process.env.GNEWS_KEY) {

    const regionalQuery = `
      "Schwäbisch Hall" OR
      "Landkreis Schwäbisch Hall" OR
      "Crailsheim" OR
      "Ilshofen" OR
      "Gaildorf" OR
      "Bausparkasse Schwäbisch Hall" OR
      "Stadtwerke Schwäbisch Hall" OR
      "Würth" OR
      "Optima" OR
      "Bausch+Ströbel" OR
      "Schubert" OR
      "Bürger" OR
      "RECARO" OR
      "ZIEHL-ABEGG"
    `;

    const regionalRes = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(regionalQuery)}&lang=de&max=15&sortby=publishedAt&token=${process.env.GNEWS_KEY}`
    );

    const regionalData = await regionalRes.json();

    const prepared = (regionalData.articles || [])
      .map(a => ({
        title: a.title,
        source: a.source?.name || "",
        url: a.url
      }))
      .filter((article, index, self) =>
        index === self.findIndex(a =>
          normalizeTitle(a.title) === normalizeTitle(article.title)
        )
      );

    function regionalScore(title){
      const t = title.toLowerCase();
      let score = 0;

      // Wirtschaft priorisieren
      const business = [
        "würth","optima","bausparkasse",
        "stadtwerke","bausch","schubert",
        "bürger","recaro","ziehl"
      ];
      business.forEach(k => {
        if (t.includes(k)) score += 10;
      });

      // Infrastruktur / Politik
      const infra = [
        "gemeinderat","stadtrat","verkehr",
        "bau","energie","schule"
      ];
      infra.forEach(k => {
        if (t.includes(k)) score += 5;
      });

      // Blaulicht leicht abwerten
      const blue = [
        "unfall","polizei","tödlich",
        "feuerwehr"
      ];
      blue.forEach(k => {
        if (t.includes(k)) score -= 3;
      });

      return score;
    }

    regional = prepared
      .sort((a, b) => regionalScore(b.title) - regionalScore(a.title))
      .slice(0, 3);
  }

} catch (e) {
  regional = [];
}


    
    /* =========================
       EVENTS – Smart Week Logic
    ========================== */

    const today = new Date();
    const currentYear = today.getFullYear();

    const day = today.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

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

    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const weeklyEvents = [
      {
        title: "Wochenmarkt",
        city: "Schwäbisch Hall",
        start: wednesday,
        end: wednesday,
        location: "Marktplatz Schwäbisch Hall"
      },
      {
        title: "Wochenmarkt",
        city: "Crailsheim",
        start: saturday,
        end: saturday,
        location: "Innenstadt Crailsheim"
      }
    ];

    const allEvents = [...yearlyEvents, ...weeklyEvents];

    let events = allEvents.filter(e =>
      e.start <= sunday && e.end >= monday
    );

    if (events.length === 0) {
      const upcoming = allEvents
        .filter(e => e.start > today)
        .sort((a, b) => a.start - b.start);

      if (upcoming.length > 0) {
        events = [upcoming[0]];
      }
    }

    events = events.map(e => ({
      title: e.title,
      city: e.city,
      date: e.start.toLocaleDateString("de-DE"),
      location: e.location
    }));

    /* =========================
       RESPONSE
    ========================== */

    res.status(200).json({
      version,
      timestamp,

      focus: {
        title: "Heute im Fokus",
        text: "Geopolitik und Energiepreise bleiben diese Woche entscheidend. Märkte reagieren sensibel auf politische Signale."
      },

dance: [
  {
    title: "Semba Night Stuttgart",
    city: "Stuttgart",
    date: "22.03.2026",
    location: "Tanzstudio La Clave",
    style: "Semba"
  },
  {
    title: "Kizomba Social Heilbronn",
    city: "Heilbronn",
    date: "05.04.2026",
    location: "Dance & Flow Studio",
    style: "Kizomba"
  },
  {
    title: "Salsa Weekend Festival",
    city: "Barcelona",
    date: "18.04.2026",
    location: "Hotel Arts Barcelona",
    style: "Salsa"
  }
],
      
      news,
      regional,
      events,

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
    });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "API Fehler" });
  }
};
