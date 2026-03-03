module.exports = async function handler(req, res) {
  try {
    const version = "19.4.1";
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
              .replace(/<!CDATA\[(.*?)\]>/, "$1")
              .trim(),
            url: linkMatch[1].trim(),
            source: sourceName
          });
        }
      });

      return items;
    }

    /* =========================
       GLOBAL NEWS
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
        const is
