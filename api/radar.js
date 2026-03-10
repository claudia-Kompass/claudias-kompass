module.exports = async function handler(req,res){

try{

const feeds = [

"https://www.meetup.com/find/events/rss/?keywords=kizomba&source=EVENTS",
"https://www.meetup.com/find/events/rss/?keywords=salsa&source=EVENTS"

]

let radar=[]

for(const url of feeds){

const r = await fetch(url)
const xml = await r.text()

const items = xml.match(/<title>(.*?)<\/title>/g) || []

items.forEach(i=>{

const title = i.replace(/<\/?title>/g,"")

if(
title.toLowerCase().includes("kizomba") ||
title.toLowerCase().includes("salsa") ||
title.toLowerCase().includes("bachata") ||
title.toLowerCase().includes("semba")
){
radar.push({title})
}

})

}

radar = radar.slice(0,10)

res.status(200).json({radar})

}catch(err){

console.log("Radar error")

res.status(200).json({radar:[]})

}

}
