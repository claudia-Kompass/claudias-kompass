export default async function handler(req,res){

try{

const feeds = [

{
url:"https://www.n-tv.de/rss/boerse.xml",
source:"n-tv Börse"
},

{
url:"https://www.coindesk.com/arc/outboundfeeds/rss/",
source:"CoinDesk"
}

]

let news=[]

for(const feed of feeds){

try{

const r = await fetch(feed.url)
const xml = await r.text()

const items = [...xml.matchAll(/<item>(.*?)<\/item>/gs)]

items.slice(0,3).forEach(i=>{

const block = i[1]

const title = block.match(/<title>(.*?)<\/title>/)?.[1] || ""
const link  = block.match(/<link>(.*?)<\/link>/)?.[1] || ""

news.push({
title:title.replace(/<!\[CDATA\[|\]\]>/g,""),
url:link,
source:feed.source
})

})

}catch(e){
console.log("feed error",feed.url)
}

}

news = news.slice(0,6)

res.status(200).json({
financeNews:news
})

}catch(err){

res.status(500).json({
financeNews:[]
})

}

}
