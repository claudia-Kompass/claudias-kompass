module.exports = async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "s-maxage=600, stale-while-revalidate=1200"
  )

  async function fetchFeed(url) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 GLOBAL-SOUL-Daily-Compass/1.0",
          "Accept":
            "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
        }
      })

      if (!response.ok) return ""
      return await response.text()
    } catch {
      return ""
    }
  }

  function cleanText(value = "") {
    return String(value)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#x27;/gi, "'")
      .replace(/&#x2F;/gi, "/")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/\s+/g, " ")
      .trim()
  }

  function getTag(block, tag) {
    const match = block.match(
      new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
    )

    return match ? cleanText(match[1]) : ""
  }

  function parseFeed(xml, source) {
    if (!xml) return []

    const entries =
      xml.match(/<(item|entry)\b[\s\S]*?<\/(item|entry)>/gi) || []

    const result = []

    for (const entry of entries) {
      const title = getTag(entry, "title")

      const summary =
        getTag(entry, "description") ||
        getTag(entry, "summary") ||
        getTag(entry, "content")

      let url = getTag(entry, "link")

      if (!url) {
        const href = entry.match(
          /<link\b[^>]*href=["']([^"']+)["'][^>]*>/i
        )

        url = href ? cleanText(href[1]) : ""
      }

      if (title && url && /^https?:\/\//i.test(url)) {
        result.push({
          title,
          url,
          source,
          summary: summary.slice(0, 500)
        })
      }
    }

    return result
  }

  const politicalTerms = [
    "mélenchon",
    "melenchon",
    "merkel",
    "wahlkampf",
    "bundestag",
    "außenpolitik",
    "innenpolitik"
  ]

  const feedDefinitions = [
    {
      url: "https://www.tagesschau.de/wirtschaft/index~rss2.xml",
      source: "Tagesschau Wirtschaft"
    },
    {
      url: "https://feeds.bbci.co.uk/news/business/rss.xml",
      source: "BBC Business"
    },
    {
      url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
      source: "CoinDesk"
    }
  ]

  try {
    const feeds = await Promise.all(
      feedDefinitions.map(feed => fetchFeed(feed.url))
    )

    const all = feeds.flatMap((xml, index) =>
      parseFeed(xml, feedDefinitions[index].source)
    )

    const seen = new Set()

    const financeNews = all
      .filter(item => {
        const key = item.title
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim()

        if (!key || seen.has(key)) return false

        if (politicalTerms.some(term => key.includes(term))) {
          return false
        }

        seen.add(key)
        return true
      })
      .slice(0, 5)

    let markets = {
      bitcoin: null,
      nexo: null
    }

    try {
      const marketRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur"
      )

      if (marketRes.ok) {
        const marketData = await marketRes.json()

        markets = {
          bitcoin: marketData.bitcoin?.eur ?? null,
          nexo: marketData.nexo?.eur ?? null
        }
      }
    } catch {
      // Kursdaten bleiben bei einem Fehler null.
    }

    return res.status(200).json({
      financeNews,
      markets
    })
  } catch {
    return res.status(200).json({
      financeNews: [],
      markets: {
        bitcoin: null,
        nexo: null
      }
    })
  }
}