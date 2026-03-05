/* ===========================
GLOBAL SOUL v27.2-STABLE
=========================== */

module.exports = async function handler(req,res){

res.setHeader("Cache-Control","s-maxage=900, stale-while-revalidate=3600")
res.setHeader("X-Content-Type-Options","nosniff")
res.setHeader("X-Frame-Options","DENY")

if(req.method!=="GET") return res.status(405).end()

const version="v27.2-STABLE"
const now=new Date()

const build=now.toLocaleDateString("de-DE",{timeZone:"Europe/Berlin"})
const timestamp=build



/* ===========================
SAFE FETCH
=========================== */

async function safeJSON(url){

try{

const r=await fetch(url)

if(!r.ok) return null

return await r.json()

}catch{
return null
}

}

async function safeText(url){

try{

const r=await fetch(url)

if(!r.ok) return null

return await r.text()

}catch{
return null
}

}



/* ===========================
RSS PARSER
=========================== */

function parseRSS(xml,source){

const items=[]
const matches=xml?.match(/<item>([\s\S]*?)<\/item>/g)||[]

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



/* ===========================
WEATHER
=========================== */

let weather={temp:0,code:0,trend:{morning:{temp:0,code:0},afternoon:{temp:0,code:0},evening:{temp:0,code:0}}}

const weatherData=await safeJSON("https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current=temperature_2m,weathercode&hourly=temperature_2m,weathercode")

if(weatherData){

weather.temp=weatherData.current?.temperature_2m ?? 0
weather.code=weatherData.current?.weathercode ?? 0

const hours=weatherData.hourly?.time || []
const temps=weatherData.hourly?.temperature_2m || []
const codes=weatherData.hourly?.weathercode || []

function findHour(target){

const today=new Date().toISOString().split("T")[0]
const index=hours.findIndex(h=>h.startsWith(today+"T"+target))

if(index>-1){

let code=codes[index]

if(target==="21:00" && code===0) code=100

return{temp:temps[index],code}

}

return{temp:0,code:0}

}

weather.trend.morning=findHour("09:00")
weather.trend.afternoon=findHour("15:00")
weather.trend.evening=findHour("21:00")

}



/* ===========================
CRYPTO (CoinGecko)
=========================== */

let bitcoin={usd:0,eur:0,usd_24h_change:0}
let nexo={usd:0,eur:0,usd_24h_change:0}

const cryptoData=await safeJSON("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true")

if(cryptoData){

bitcoin=cryptoData.bitcoin || bitcoin
nexo=cryptoData.nexo || nexo

}



/* ===========================
MARKETS
=========================== */

const markets={
dax:{value:"18.742"},
eurusd:{value:"1.08"}
}



/* ===========================
NEWS
=========================== */

let collected=[]

const tagesschau=await safeText("https://www.tagesschau.de/xml/rss2/")
const spiegel=await safeText("https://www.spiegel.de/schlagzeilen/tops/index.rss")
const ntv=await safeText("https://www.n-tv.de/rss")

if(tagesschau) collected=collected.concat(parseRSS(tagesschau,"Tagesschau"))
if(spiegel) collected=collected.concat(parseRSS(spiegel,"Spiegel"))
if(ntv) collected=collected.concat(parseRSS(ntv,"ntv"))

const news=collected.slice(0,5)



/* ===========================
REGIONAL
=========================== */

let regional=[]

const regionalXML=await safeText("https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml")

if(regionalXML) regional=parseRSS(regionalXML,"SWR Baden-Württemberg").slice(0,4)



/* ===========================
EVENTS
=========================== */

const events={

week:[

{
title:"Freizeit Messe Nürnberg",
city:"Nürnberg",
date:"2026-03-08",
time:"09:30–18:00",
url:"https://www.freizeitmesse.de"
}

],

markets:[

{
title:"Wochenmarkt Schwäbisch Hall",
location:"Marktplatz",
day:"Mittwoch & Samstag",
time:"07:00–13:00"
},

{
title:"Wochenmarkt Crailsheim",
location:"Marktplatz",
day:"Samstag",
time:"07:00–13:00"
}

]

}



/* ===========================
TRAVEL
=========================== */

const travel={
title:"Altmühlsee – Fränkisches Seenland",
text:"Radfahren, Segeln oder entspannter Spaziergang am Seeufer.",
url:"https://www.fraenkisches-seenland.de"
}



/* ===========================
AIRFRYER ROTATION
=========================== */

const recipeDB=[

{title:"Paprika Feta",ingredients:["2 Paprika","50g Feta","1 EL Öl"],description:"Paprika schneiden, Feta darüber bröseln.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Zucchini Parmesan",ingredients:["1 Zucchini","2 EL Parmesan"],description:"Zucchini in Scheiben schneiden.",temp:"200°C",time:"10 Minuten",portion:"2"},
{title:"Kartoffelwürfel",ingredients:["400g Kartoffeln","1 EL Öl"],description:"Kartoffeln würfeln und würzen.",temp:"200°C",time:"18 Minuten",portion:"2"},
{title:"Brokkoli Crunch",ingredients:["1 Brokkoli","1 EL Öl"],description:"Brokkoli in Röschen.",temp:"190°C",time:"10 Minuten",portion:"2"}

]

const recipeIndex=Math.floor(Date.now()/86400000)%recipeDB.length
const recipe=recipeDB[recipeIndex]



/* ===========================
LANGUAGE ROTATION
=========================== */

const languageDB=[

{en:"Where is the train station?",es:"¿Dónde está la estación?",de:"Wo ist der Bahnhof?"},
{en:"Where is the bus stop?",es:"¿Dónde está la parada?",de:"Wo ist die Bushaltestelle?"},
{en:"How much does this cost?",es:"¿Cuánto cuesta esto?",de:"Wie viel kostet das?"},
{en:"Two coffees please.",es:"Dos cafés por favor.",de:"Zwei Kaffee bitte."},
{en:"Where is the restroom?",es:"¿Dónde está el baño?",de:"Wo ist die Toilette?"}

]

const langIndex=Math.floor(Date.now()/86400000)%languageDB.length
const language=[languageDB[langIndex]]



/* ===========================
UKULELE
=========================== */

const ukulele={
song:"Pop Progression",
chords:"C – G – Am – F"
}



/* ===========================
QUOTE
=========================== */

const quote={
text:"Der Weg entsteht beim Gehen.",
author:"Franz Kafka"
}



/* ===========================
RESPONSE
=========================== */

res.status(200).json({

version,
build,
timestamp,

news,
regional,
events,

markets,

crypto:{
bitcoin,
nexo,
links:{
bitcoin:"https://www.tradingview.com/symbols/BTCUSD/",
nexo:"https://www.tradingview.com/symbols/NEXOUSD/"
}
},

weather,
travel,
recipe,
language,
ukulele,
quote

})

}
