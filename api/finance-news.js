// =====================================================
// FINANCE NEWS API
// =====================================================

const POLITICAL_TERMS = [
  "wahl",
  "partei",
  "bundestag",
  "regierung",
  "kanzler",
  "minister",
  "afd",
  "cdu",
  "csu",
  "spd",
  "grüne",
  "gruene",
  "linke",
  "frieden",
  "krieg",
  "trump",
  "biden",
  "putin",
  "ukraine",
  "gaza",
  "israel",
  "palästina",
  "palaestina",
];

const FEEDS = [
  {
    name: "Tagesschau",
    url: "https://www.tagesschau.de/wirtschaft/index~rss2.xml",
  },
  {
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
  },
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  },
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=Finanzen+Wirtschaft&hl=de&gl=DE&ceid=DE:de",
  },
];

// =====================================================
// TEXT BEREINIGEN
// =====================================================

function cleanText(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[/gi, "")
    .replace(/\]\]>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCharCode(Number(number))
    )
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================================
// XML TAG AUSLESEN
// =====================================================

function getTag(block, tagName) {
  const expression = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`,
    "i"
  );

  const match = block.match(expression);
  return match ? cleanText(match[1]) : "";
}

// =====================================================
// RSS / ATOM FEED LADEN
// =====================================================

async function fetchFeed(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 Global Soul Finance News",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const articles = [];

    // -------------------------------------------------
    // RSS FORMAT
    // -------------------------------------------------

    const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

    for (const item of rssItems) {
      const title = getTag(item, "title");
      const description =
        getTag(item, "description") || getTag(item, "summary");
      const pubDate =
        getTag(item, "pubDate") || getTag(item, "published");
      const link = getTag(item, "link");

      if (!title || !link) continue;

    articles.push({
  source: feed.name,
  title,
  description,
  url: link,
  link,
  pubDate,
});
    }

    // -------------------------------------------------
    // ATOM FORMAT
    // -------------------------------------------------

    const atomEntries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

    for (const entry of atomEntries) {
      const title = getTag(entry, "title");
      const description =
        getTag(entry, "summary") || getTag(entry, "content");
      const pubDate =
        getTag(entry, "published") || getTag(entry, "updated");

      let link = "";

      const linkMatch = entry.match(
        /<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i
      );

      if (linkMatch) {
        link = linkMatch[1];
      } else {
        link = getTag(entry, "link");
      }

      if (!title || !link) continue;

     articles.push({
  source: feed.name,
  title,
  description,
  url: link,
  link,
  pubDate,
});
    }

    return articles;
  } finally {
    clearTimeout(timeout);
  }
}

// =====================================================
// POLITISCHE MELDUNGEN HERAUSFILTERN
// =====================================================

function isPolitical(article) {
  const text = `${article.title} ${article.description}`.toLowerCase();

  return POLITICAL_TERMS.some((term) => text.includes(term));
}

// =====================================================
// HAUPT-HANDLER
// =====================================================

export default async function handler(req, res) {
  try {
    const feedResults = await Promise.allSettled(
      FEEDS.map((feed) => fetchFeed(feed))
    );

    const rssArticles = feedResults
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    const financeNews = rssArticles
      .filter((article) => !isPolitical(article))
      .filter((article) => article.title && article.link)
      .sort((a, b) => {
        const dateA = new Date(a.pubDate || 0).getTime();
        const dateB = new Date(b.pubDate || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 20);

    // =================================================
    // MARKTDATEN
    // =================================================

    let markets = [];

    try {
      const marketResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true",
        {
          headers: {
            "User-Agent": "Mozilla/5.0 Global Soul Finance News",
            Accept: "application/json",
          },
        }
      );

      if (marketResponse.ok) {
        const marketData = await marketResponse.json();

        markets = [
          {
            name: "Bitcoin",
            symbol: "BTC",
            price: marketData.bitcoin?.eur ?? null,
            change24h: marketData.bitcoin?.eur_24h_change ?? null,
          },
          {
            name: "Nexo",
            symbol: "NEXO",
            price: marketData.nexo?.eur ?? null,
            change24h: marketData.nexo?.eur_24h_change ?? null,
          },
        ];
      }
    } catch (marketError) {
      console.error("Marktdaten konnten nicht geladen werden:", marketError);
    }

    return res.status(200).json({
      ok: true,
      financeNews,
      markets,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Finance News API Fehler:", error);

    return res.status(200).json({
      ok: false,
      financeNews: [],
      markets: [],
      error: "Finanzmeldungen konnten momentan nicht geladen werden.",
      updatedAt: new Date().toISOString(),
    });
  }
}