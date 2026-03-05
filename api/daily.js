module.exports = async function handler(req,res){

res.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=600")
res.setHeader("X-Content-Type-Options","nosniff")
res.setHeader("X-Frame-Options","DENY")
res.setHeader("X-XSS-Protection","1; mode=block")

if(req.method!=="GET"){return res.status(405).end()}

const origin=req.headers.origin||""
if(origin && !origin.includes("vercel.app")){
return res.status(403).json({error:"Forbidden"})
}

const ua=req.headers["user-agent"]||""
if(ua.length<5){return res.status(403).json({error:"Bot blocked"})}

const version="24.0.0"

const now=new Date()

const timestamp=now.toLocaleString("de-DE",{timeZone:"Europe/Berlin"})
const marketDate=now.toLocaleDateString("de-DE",{timeZone:"Europe/Berlin"})

function fetchTimeout(url,ms=4000){
return Promise.race([
fetch(url),
new Promise((_,reject)=>setTimeout(()=>reject("timeout"),ms))
])
}

function parseRSS(xml,source){
const items=[]
const matches=xml.match(/<item>([\s\S]*?)<\/item>/g)||[]

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

let weather={temp:0,code:0,trend:{morning:{temp:0,code:0},afternoon:{temp:0,code:0},evening:{temp:0,code:0}}}
let bitcoin={usd:0,eur:0,usd_24h_change:0}
let nexo={usd:0,eur:0,usd_24h_change:0}
let news=[]
let regional=[]

try{

const[
weatherRes,
cryptoRes,
tagesschauRes,
spiegelRes,
regionalRes
]=await Promise.all([

fetchTimeout("https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current=temperature_2m,weathercode&hourly=temperature_2m,weathercode"),

fetchTimeout("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true"),

fetchTimeout("https://www.tagesschau.de/xml/rss2/"),

fetchTimeout("https://www.spiegel.de/schlagzeilen/tops/index.rss"),

fetchTimeout("https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml")

])

if(weatherRes){
const d=await weatherRes.json()

weather.temp=d.current?.temperature_2m??0
weather.code=d.current?.weathercode??0

const hours=d.hourly.time
const temps=d.hourly.temperature_2m
const codes=d.hourly.weathercode

function findHour(target){

const today=new Date().toISOString().split("T")[0]

const index=hours.findIndex(h=>h.startsWith(today+"T"+target))

if(index>-1){

let code=codes[index]

/* Nachtlogik */

if(target==="21:00" && code===0){
code=100
}

return{
temp:temps[index],
code
}

}

return{temp:0,code:0}

}

weather.trend.morning=findHour("09:00")
weather.trend.afternoon=findHour("15:00")
weather.trend.evening=findHour("21:00")
}

if(cryptoRes){
const d=await cryptoRes.json()
bitcoin=d.bitcoin||bitcoin
nexo=d.nexo||nexo
}

let collected=[]

if(tagesschauRes){
const xml=await tagesschauRes.text()
collected=collected.concat(parseRSS(xml,"Tagesschau"))
}

if(spiegelRes){
const xml=await spiegelRes.text()
collected=collected.concat(parseRSS(xml,"Spiegel"))
}

news=collected.slice(0,5)

if(regionalRes){
const xml=await regionalRes.text()
regional=parseRSS(xml,"SWR Baden-Württemberg").slice(0,4)
}

}catch(e){console.log(e)}

const markets={
dax:{value:"18.742",date:"Stand "+marketDate},
eurusd:{value:"1.08",date:"Stand "+marketDate}
}

const events={
week:[
{
title:"Genussmesse Heilbronn",
city:"Heilbronn",
date:"2026-03-07",
time:"10:00–18:00",
url:"https://redblue.de/"
},
{
title:"Freizeit Messe Nürnberg",
city:"Nürnberg",
date:"2026-03-08",
time:"09:30–18:00",
url:"https://www.freizeitmesse.de"
}
]
}

/* PERSONAL MODULES */

const travel={
title:"Altmühlsee – Fränkisches Seenland",
text:"Radfahren, Segeln oder entspannter Spaziergang am Seeufer.",
url:"https://www.fraenkisches-seenland.de"
}

const recipe={
title:"Knusprige Zucchini",
text:"1 Zucchini • Olivenöl • Parmesan • 200°C • 10 Minuten",
url:"https://www.chefkoch.de/rezepte/3988791628617063/Knusprige-Zucchini.html"
}

const language={
en:"Where is the market?",
es:"¿Dónde está el mercado?",
de:"Wo ist der Markt?"
}

const ukulele={
song:"Pop Progression",
chords:"C – G – Am – F"
}

const quote={
text:"Der Weg entsteht beim Gehen.",
author:"Franz Kafka"
}

res.status(200).json({
version,
timestamp,
news,
regional,
events,
markets,
crypto:{bitcoin,nexo},
weather,
travel,
recipe,
language,
ukulele,
quote
})

}
