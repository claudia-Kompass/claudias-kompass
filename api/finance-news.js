module.exports = async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "s-maxage=600, stale-while-revalidate=1200"
  )

  async function fetchRSS(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) return ""
      return await response.text()
    } catch {
      return ""
    }
  }

  function cleanText(value = "") {
    return value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim()
  }

  function parse(xml, source) {
    if (!xml) return []

    const items = []
    const matches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || []

    for (const item of matches) {
      const titleMatch = item.match(
        /<title\b[^>]*>([\s\S]*?)<\/title>/i
      )

      const linkMatch = item.match(
        /<link\b[^>]*>([\s\S]*?)<\/link>/i
      )

      const descriptionMatch = item.match(
        /<description\b[^>]*>([\s\S]*?)<\/description>/i
      )

      if (!titleMatch || !linkMatch) continue

      const title = cleanText(titleMatch[1])
      const url = cleanText(linkMatch[1])
      const summary = cleanText(descriptionMatch?.[1] || "")

      if (title && url) {
        items.push({
          title,
          url,
          source,
          summary: summary.slice(0, 500)
        })
      }
    }

    return items
  }

  const politicalTerms = [
    "mél",
    "mélenchon",
    "melenchon",
    "merkel",
    "partei",
    "wahlkampf",
    "regierung",
    "koalition",
    "opposition",
    "ministerpräsident",
    "außenpolitik",
    "innenpolitik",
    "bundestag"
  ]

  try {
    const feeds = await Promise.all([
      fetchRSS(
        "https://www.tagesschau.de/wirtschaft/index~rss2.xml"
      ),
      fetchRSS(
        "https://www.reuters.com/markets/rss"
      ),
      fetchRSS(
        "https://www.coindesk.com/arc/outboundfeeds/rss/"
      )
    ])

    const all = [
      ...parse(feeds[0], "Tagesschau Wirtschaft"),
      ...parse(feeds[1], "Reuters Markets"),
      ...parse(feeds[2], "CoinDesk")
    ]

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
          bitcoin: marketData.bitcoin?.eur || null,
          nexo: marketData.nexo?.eur || null
        }
      }
    } catch {
      // Bei einem Fehler bleiben die Werte null.
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