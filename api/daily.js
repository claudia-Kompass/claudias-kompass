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
       GLOBAL NEWS (RSS First)
    ========================== */

    let news = [];

    try {
      const globalSources = [
        { url: "https://www.tagesschau.de/xml/rss2", name: "Tagesschau" },
        { url: "https://www.spiegel.de/schlagzeilen/index.rss", name: "Spiegel" },
        { url: "https://rss.dw.com/rdf/rss-de-all", name: "DW" }
      ];

      let rssNews = [];

      for (const src of globalSources) {
        try {
          const r = await fetch(src.url);
          const text = await r.text();
          rssNews = rssNews.concat(parseRSS(text, src.name));
        } catch {}
      }

      function globalTopic(title){
        const t = (title || "").toLowerCase();
        if (t.includes("iran")) return "iran";
        if (t.includes("ukraine")) return "ukraine";
        if (t.includes("china")) return "china";
        if (t.includes("wahl")) return "politik";
        if (t.includes("dax") || t.includes("inflation")) return "markt";
        return "other";
      }

      news = rssNews
        .filter((article, index, self) =>
          index === self.findIndex(a =>
            normalizeTitle(a.title) === normalizeTitle(article.title)
          )
        )
        .map(a => ({
          ...a,
          score: scoreArticle(a),
          topic: globalTopic(a.title)
        }))
        .sort((a,b) => b.score - a.score);

      const clustered = [];
      for (const article of news) {
        if (!clustered.find(a => a.topic === article.topic)) {
          clustered.push(article);
        }
      }

      news = clustered
        .slice(0,5)
        .map(({ score, topic, ...rest }) => rest);

    } catch {
      news = [];
    }

    /* =========================
       REGIONAL
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

      const allowedGeo = [
        "schwäbisch hall",
        "landkreis schwäbisch hall",
        "crailsheim",
        "gaildorf",
        "ilshofen",
        "gerabronn",
        "langenbur",
        "rot am see"
      ];

      const regionalCompanies = [
        "stadtwerke schwäbisch hall",
        "stadtwerke sha",
        "bausparkasse schwäbisch hall",
        "würth",
        "optima",
        "ziehl-abegg"
      ];

      regional = rssArticles
        .filter(a => {
          const t = (a.title || "").toLowerCase();
          return (
            allowedGeo.some(g => t.includes(g)) ||
            regionalCompanies.some(c => t.includes(c))
          );
        })
        .map(a => ({
          ...a,
          score: scoreArticle(a)
        }))
        .sort((a,b) => b.score - a.score)
        .slice(0,4)
        .map(({ score, ...rest }) => rest);

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
      }
    });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "API Fehler" });
  }
};
