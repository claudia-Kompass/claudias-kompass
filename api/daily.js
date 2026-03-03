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

        if (titleMatch && linkMatch) {
          items.push({
            title: titleMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, "$1")
              .trim(),
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
       GLOBAL NEWS (GNews)
    ========================== */

    let news = [];

    try {
      if (process.env.GNEWS_KEY) {
        let newsRes = await fetch(
          `https://gnews.io/api/v4/top-headlines?country=de&lang=de&max=10&token=${process.env.GNEWS_KEY}`
        );

        let newsJson = await newsRes.json();

        if (!newsJson.articles || newsJson.articles.length === 0) {
          newsRes = await fetch(
            `https://gnews.io/api/v4/top-headlines?category=world&lang=de&max=10&token=${process.env.GNEWS_KEY}`
          );
          newsJson = await newsRes.json();
        }

        const prepared = (newsJson.articles || [])
          .map(a => ({
            title: a.title,
            source: a.source?.name || "",
            url: a.url,
            topic: topicKey(a.title),
            score: scoreArticle(a)
          }))
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
      }
    } catch {
      news = [];
    }

    /* =========================
       REGIONAL (ABGESTIMMT)
    ========================== */

    let regional = [];

    try {
      const rssSources = [
        "https://www.swp.de/rss/suedwesten.xml",
        "https://www.haller-stimme.de/feed/"
      ];

      let rssArticles = [];

      for (const url of rssSources) {
        try {
          const r = await fetch(url);
          const text = await r.text();
          rssArticles = rssArticles.concat(parseRSS(text, "Regional"));
        } catch {}
      }

      let gnewsArticles = [];

      if (process.env.GNEWS_KEY) {
        const localQuery = encodeURIComponent(
          '"Schwäbisch Hall" OR Crailsheim OR Gaildorf OR Ilshofen'
        );

        const gRes = await fetch(
          `https://gnews.io/api/v4/search?q=${localQuery}&lang=de&max=10&token=${process.env.GNEWS_KEY}`
        );

        const gJson = await gRes.json();

        gnewsArticles = (gJson.articles || []).map(a => ({
          title: a.title,
          url: a.url,
          source: a.source?.name || ""
        }));
      }

      regional = [...rssArticles, ...gnewsArticles]
        .filter((article, index, self) =>
          index === self.findIndex(a =>
            normalizeTitle(a.title) === normalizeTitle(article.title)
          )
        );

      const allowedGeo = [
        "schwäbisch hall","landkreis schwäbisch hall",
        "crailsheim","gaildorf","ilshofen",
        "gerabronn","langenbur","rot am see"
      ];

      const regionalCompanies = [
        "stadtwerke schwäbisch hall","stadtwerke sha",
        "bausparkasse schwäbisch hall",
        "würth","optima","bausch",
        "schubert","bürger","ziehl-abegg","recaro"
      ];

      regional = regional.filter(a => {
        const t = (a.title || "").toLowerCase();
        return (
          allowedGeo.some(g => t.includes(g)) ||
          regionalCompanies.some(c => t.includes(c))
        );
      });

      function regionalScore(title){
        const t = (title || "").toLowerCase();
        let score = 0;

        if (t.includes("stadtwerke")) score += 8;
        if (t.includes("bausparkasse")) score += 7;
        if (t.includes("würth")) score += 6;
        if (t.includes("optima")) score += 6;
        if (t.includes("wahl")) score += 7;
        if (t.includes("landtag")) score += 7;

        if (t.includes("unfall")) score -= 3;
        if (t.includes("tödlich")) score -= 3;
        if (t.includes("polizei")) score -= 2;

        return score;
      }

      regional = regional
        .map(a => ({ ...a, score: regionalScore(a.title) }))
        .sort((a,b) => b.score - a.score);

      let blaulichtCount = 0;

      regional = regional.filter(a => {
        const t = (a.title || "").toLowerCase();
        const isBlaulicht =
          t.includes("unfall") ||
          t.includes("tödlich") ||
          t.includes("polizei");

        if (isBlaulicht) {
          blaulichtCount++;
          return blaulichtCount <= 1;
        }
        return true;
      });

      regional = regional.slice(0,4);
      regional = regional.map(({ score, ...rest }) => rest);

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
