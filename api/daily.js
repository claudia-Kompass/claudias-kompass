module.exports = async function handler(req, res) {
  try {
    const version = "19.4.3";
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

      ["krieg","iran","ukraine","wahl","inflation"]
        .forEach(k => { if (text.includes(k)) score += 6; });

      return score;
    }

    /* =========================
       GLOBAL NEWS
    ========================== */

    let news = [];

    try {
      const sources = [
        { url: "https://www.tagesschau.de/xml/rss2", name: "Tagesschau" },
        { url: "https://www.spiegel.de/schlagzeilen/index.rss", name: "Spiegel" }
      ];

      let rssNews = [];

      for (const src of sources) {
        try {
          const r = await fetch(src.url);
          const text = await r.text();
          rssNews = rssNews.concat(parseRSS(text, src.name));
        } catch {}
      }

      news = rssNews
        .filter((article, index, self) =>
          index === self.findIndex(a =>
            normalizeTitle(a.title) === normalizeTitle(article.title)
          )
        )
        .map(a => ({ ...a, score: scoreArticle(a) }))
        .sort((a,b) => b.score - a.score)
        .slice(0,5)
        .map(({ score, ...rest }) => rest);

    } catch {
      news = [];
    }

    /* =========================
       REGIONAL
    ========================== */

    let regional = [];

    try {
      const r = await fetch("https://www.haller-stimme.de/feed/");
      const text = await r.text();
      const items = parseRSS(text, "Haller Stimme");

      regional = items
        .filter(a =>
          a.title.toLowerCase().includes("schwäbisch") ||
          a.title.toLowerCase().includes("crailsheim")
        )
        .slice(0,4);

    } catch {
      regional = [];
    }

    /* =========================
       CRYPTO (LIVE)
    ========================== */

    let bitcoin = { usd: 0, eur: 0 };
    let nexo = { usd: 0, eur: 0 };

    try {
      const cryptoRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur"
      );
      const cryptoData = await cryptoRes.json();

      if (cryptoData.bitcoin) bitcoin = cryptoData.bitcoin;
      if (cryptoData.nexo) nexo = cryptoData.nexo;

    } catch {}

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
      }
    });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "API Fehler" });
  }
};
