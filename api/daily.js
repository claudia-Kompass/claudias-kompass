module.exports = async function handler(req, res) {
  try {

    const version = "19.5.0";
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

    /* =========================
       CRYPTO
    ========================== */

    let bitcoin = { usd: 0, eur: 0, usd_24h_change: 0 };
    let nexo = { usd: 0, eur: 0, usd_24h_change: 0 };

    try {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true"
      );
      const data = await r.json();
      if (data.bitcoin) bitcoin = data.bitcoin;
      if (data.nexo) nexo = data.nexo;
    } catch {}

    /* =========================
       WETTER
    ========================== */

    let currentTemp = 0;
    let currentCode = 0;

    try {
      const r = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true"
      );
      const data = await r.json();
      currentTemp = data.current_weather?.temperature ?? 0;
      currentCode = data.current_weather?.weathercode ?? 0;
    } catch {}

    /* =========================
       GLOBAL NEWS
    ========================== */

    let news = [];

    try {
      const sources = [
        { url: "https://www.tagesschau.de/xml/rss2/", name: "Tagesschau" },
        { url: "https://www.spiegel.de/schlagzeilen/tops/index.rss", name: "Spiegel" }
      ];

      let collected = [];

      for (const src of sources) {
        try {
          const r = await fetch(src.url);
          const text = await r.text();
          collected = collected.concat(parseRSS(text, src.name));
        } catch {}
      }

      news = collected
        .filter((a, i, self) =>
          i === self.findIndex(b =>
            normalizeTitle(a.title) === normalizeTitle(b.title)
          )
        )
        .slice(0, 5);

    } catch {
      news = [];
    }

    /* =========================
       REGIONAL NEWS
    ========================== */

    let regional = [];

    try {
      const r = await fetch(
        "https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml"
      );
      const text = await r.text();
      const items = parseRSS(text, "Tagesschau BW");

      regional = items.slice(0, 4);

    } catch {
      regional = [];
    }

    /* =========================
       EVENTS
    ========================== */

    let danceEvents = [];
    let danceFestivals = [];
    let tradeFairs = [];
    let weeklyMarkets = [];

    /* ---------- TANZ EVENTS (Eventbrite) ---------- */

    if (process.env.EVENTBRITE_TOKEN) {
      try {

        const nowISO = new Date().toISOString();

        const url =
          "https://www.eventbriteapi.com/v3/events/search/?" +
          "q=salsa%20OR%20bachata%20OR%20kizomba%20OR%20semba&" +
          "location.latitude=49.1399&" +
          "location.longitude=9.2200&" +
          "location.within=180km&" +
          "start_date.range_start=" + nowISO +
          "&sort_by=date";

        const r = await fetch(url, {
          headers: {
            Authorization: "Bearer " + process.env.EVENTBRITE_TOKEN
          }
        });

        if (r.ok) {
          const data = await r.json();

          danceEvents = (data.events || [])
            .slice(0, 8)
            .map(e => ({
              title: e.name?.text || "",
              date: new Date(e.start?.local).toLocaleDateString("de-DE"),
              city: e.venue?.address?.city || "",
              url: e.url
            }));
        }

      } catch {}
    }

    /* ---------- TANZ FESTIVALS (RSS) ---------- */

    try {

      const rssSources = [
        "https://www.eventbrite.de/d/germany/salsa/rss/",
        "https://www.eventbrite.de/d/germany/bachata/rss/",
        "https://www.eventbrite.de/d/germany/kizomba/rss/"
      ];

      const keywords = ["festival","congress","marathon"];

      let collected = [];

      for (const url of rssSources) {
        try {
          const r = await fetch(url);
          const xml = await r.text();
          const items = parseRSS(xml,"Eventbrite");
          collected = collected.concat(items);
        } catch {}
      }

      danceFestivals = collected
        .filter(e => {
          const text = (e.title || "").toLowerCase();
          return keywords.some(k => text.includes(k));
        })
        .slice(0,6);

    } catch {}

    /* ---------- VERBRAUCHERMESSEN ---------- */

    tradeFairs = [
      { name: "CMT", city: "Stuttgart", period: "Januar" },
      { name: "Consumenta", city: "Nürnberg", period: "Oktober/November" },
      { name: "Kreativ Messe", city: "Stuttgart", period: "Herbst" }
    ];

    /* ---------- WOCHENMÄRKTE ---------- */

    weeklyMarkets = [
      {
        city: "Schwäbisch Hall",
        location: "Marktplatz",
        day: "Mittwoch & Samstag",
        time: "07:00 – 13:00"
      },
      {
        city: "Öhringen",
        location: "Marktplatz",
        day: "Freitag",
        time: "07:00 – 13:00"
      },
      {
        city: "Heilbronn",
        location: "Kiliansplatz",
        day: "Dienstag, Donnerstag, Samstag",
        time: "07:00 – 13:00"
      }
    ];

    /* =========================
       RESPONSE
    ========================== */

    res.status(200).json({
      version,
      timestamp,
      news,
      regional,

      events: {
        dance: danceEvents,
        festivals: danceFestivals,
        fairs: tradeFairs,
        weeklyMarkets
      },

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

    res.status(500).json({
      error: "API Fehler"
    });

  }
};
