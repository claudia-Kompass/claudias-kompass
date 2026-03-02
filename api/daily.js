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

    try {
      if (process.env.GNEWS_KEY) {
        const newsRes = await fetch(
          `https://gnews.io/api/v4/search?q=krieg OR iran OR israel OR ukraine OR wahl OR dax OR inflation&lang=de&max=10&sortby=publishedAt&token=${process.env.GNEWS_KEY}`
        );
        const newsJson = await newsRes.json();

        news = (newsJson.articles || [])

          // Deduplizieren
          .filter((article, index, self) =>
            index === self.findIndex(a =>
              normalizeTitle(a.title) === normalizeTitle(article.title)
            )
          )

          // Scoring
          .map(a => ({
            title: a.title,
            source: a.source?.name || "",
            url: a.url,
            score: scoreArticle({
              title: a.title,
              source: a.source?.name
            })
          }))

          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(({ score, ...rest }) => rest);
      }
    } catch (e) {
      news = [];
    }

    /* =========================
       REGIONAL
    ========================== */

    let regional = [];

    try {
      if (process.env.GNEWS_KEY) {
        const regionalRes = await fetch(
          `https://gnews.io/api/v4/search?q=Schwäbisch Hall OR Crailsheim OR Ilshofen OR Hohenlohe&lang=de&max=6&sortby=publishedAt&token=${process.env.GNEWS_KEY}`
        );
        const regionalData = await regionalRes.json();

        regional = (regionalData.articles || [])

          .filter((article, index, self) =>
            index === self.findIndex(a =>
              normalizeTitle(a.title) === normalizeTitle(article.title)
            )
          )

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
