export default async function handler(req, res) {

  const feeds = [
    "https://www.goandance.com/en/events.rss",
    "https://allevents.in/rss/salsa",
    "https://bachatafestivalcalendar.com/feed",
    "https://www.eventbrite.com/d/online/latin-dance--events/rss/"
  ];

  const KEYWORDS = /salsa|kizomba|semba|bachata|latin|afro/i;

  let festivals = [];

  for (const url of feeds) {
    try {
      const r = await fetch(url);
      const xml = await r.text();

      const items = [...xml.matchAll(/<item>(.*?)<\/item>/gs)];

      items.forEach(i => {
        const block = i[1];

        const title = (block.match(/<title>(.*?)<\/title>/i) || [])[1] || "";
        const link  = (block.match(/<link>(.*?)<\/link>/i)  || [])[1] || "";

        if (!KEYWORDS.test(title)) return;

        festivals.push({
          title,
          url: link,
          style: "festival"
        });
      });

    } catch (e) {
      console.log("feed error", url);
    }
  }

  // Duplikate entfernen
  const seen = new Set();
  festivals = festivals.filter(f => {
    if (seen.has(f.title)) return false;
    seen.add(f.title);
    return true;
  });

  res.json({ festivals });
}
