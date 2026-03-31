module.exports = async function handler(req, res) {

  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200")

  async function fetchRSS(url){
    try{
      const r = await fetch(url)
      if(!r.ok) return ""
      return await r.text()
    }catch{
      return ""
    }
  }

  function parse(xml,source){
    if(!xml) return []

    const items=[]
    const matches = xml.match(/<item>[\s\S]*?<\/item>/g) || []

    matches.forEach(item=>{
      const t=item.match(/<title>(.*?)<\/title>/)
      const l=item.match(/<link>(.*?)<\/link>/)

      if(t && l){
        items.push({
          title:t[1].replace(/<!\[CDATA\[(.*?)\]\]>/,"$1"),
          url:l[1],
          source
        })
      }
    })

    return items
  }

  try{

    // 🔹 NEWS
    const feeds = await Promise.all([
      fetchRSS("https://www.tagesschau.de/wirtschaft/index~rss2.xml"),
      fetchRSS("https://www.reuters.com/markets/rss"),
      fetchRSS("https://www.coindesk.com/arc/outboundfeeds/rss/"),
      fetchRSS("https://www.n-tv.de/rss")
    ])

    let news = [
      ...parse(feeds[0],"Tagesschau Wirtschaft"),
      ...parse(feeds[1],"Reuters Markets"),
      ...parse(feeds[2],"CoinDesk"),
      ...parse(feeds[3],"n-tv Börse")
    ]

    // 🔹 DUPLIKATE
    const seen = new Set()
    news = news.filter(n=>{
      if(seen.has(n.title)) return false
      seen.add(n.title)
      return true
    })

    news = news.slice(0,3)

    // 🔹 NEU: MARKETS (Bitcoin + Nexo)
    let markets = { bitcoin: null, nexo: null }

    try {
      const marketRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur"
      )
      const marketData = await marketRes.json()

      markets = {
        bitcoin: marketData.bitcoin?.eur || null,
        nexo: marketData.nexo?.eur || null
      }

    } catch (e) {
      // fallback bleibt null
    }

    // 🔹 RESPONSE
    res.status(200).json({
      financeNews: news,
      markets
    })

  } catch (e) {

    res.status(200).json({
      financeNews: [],
      markets: { bitcoin: null, nexo: null }
    })

  }

}
