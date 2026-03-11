export default async function handler(req,res){

const feeds = [
"https://www.goandance.com/en/events.rss",
"https://allevents.in/rss/salsa",
"https://bachatafestivalcalendar.com/feed"
]

let festivals = []

for(const url of feeds){

try{

const r = await fetch(url)
const xml = await r.text()

const items = [...xml.matchAll(/<item>(.*?)<\/item>/gs)]

items.forEach(i=>{

const block = i[1]

const title = (block.match(/<title>(.*?)<\/title>/)||[])[1] || ""
const link = (block.match(/<link>(.*?)<\/link>/)||[])[1] || ""

if(!/salsa|kizomba|semba|bachata|latin/i.test(title)) return

festivals.push({
title,
url:link,
style:"festival"
})

})

}catch(e){}

}

res.json({festivals})

}
