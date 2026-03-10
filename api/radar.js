export default async function handler(req,res){

try{

const sources = [

"https://www.eventbrite.de/d/germany/kizomba/",
"https://www.eventbrite.de/d/germany/salsa/",
"https://www.eventbrite.de/d/germany/bachata/"

]

let radar=[]

for(const url of sources){

const r = await fetch(url)

const html = await r.text()

const matches = html.match(/<title>(.*?)<\/title>/g) || []

matches.forEach(t=>{

const title = t.replace(/<\/?title>/g,"")

const text = title.toLowerCase()

if(
text.includes("kizomba") ||
text.includes("semba") ||
text.includes("salsa") ||
text.includes("bachata")
){

radar.push({
title:title
})

}

})

}

res.status(200).json({radar})

}catch(err){

console.log("Radar failed")

res.status(200).json({radar:[]})

}

}
