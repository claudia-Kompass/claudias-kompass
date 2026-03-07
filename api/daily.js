const ukuleleSongs = require("./data/ukulele")
const quotes = require("./data/quotes")
const recipes = require("./data/recipes")
const languages = require("./data/languages")

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

const version="29.0"+Math.floor(Date.now()/86400000)
const build=(process.env.VERCEL_GIT_COMMIT_SHA||"local").slice(0,7)
const fullVersion=version+"."+build

const now=new Date()

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


/* =======================================================
DATA CONTAINER
======================================================= */

let weather={temp:0,code:0,trend:{morning:{temp:0,code:0},afternoon:{temp:0,code:0},evening:{temp:0,code:0}}}

let bitcoin={usd:0,eur:0,usd_24h_change:0}
let nexo={usd:0,eur:0,usd_24h_change:0}

let news=[]
let regional=[]


/* =======================================================
API FETCH
======================================================= */

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



/* WEATHER */

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


/* CRYPTO */

if(cryptoRes){

const d=await cryptoRes.json()

bitcoin=d.bitcoin||bitcoin
nexo=d.nexo||nexo

}



/* NEWS */

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



/* REGIONAL */

if(regionalRes){
const xml=await regionalRes.text()
regional=parseRSS(xml,"SWR Baden-Württemberg").slice(0,4)
}

}catch(e){console.log(e)}



/* =======================================================
MARKETS
======================================================= */

const markets={
dax:{value:"18.742",date:"Stand "+marketDate},
eurusd:{value:"1.08",date:"Stand "+marketDate}
}



/* =======================================================
EVENT ENGINE
======================================================= */

function startOfDay(d){
const x=new Date(d)
x.setHours(0,0,0,0)
return x
}

function endOfWeek(d){
const x=new Date(d)
const day=x.getDay()||7
if(day!==7)x.setDate(x.getDate()+(7-day))
x.setHours(23,59,59,999)
return x
}

function inRange(date,a,b){
return date>=a && date<=b
}



/* EVENT DATABASE */

const eventDB=[

{
title:"Genussmesse Heilbronn",
city:"Heilbronn",
location:"redblue Messehalle",
date:"2026-03-07",
time:"10:00–18:00",
url:"https://redblue.de"
},

{
title:"Freizeit Messe Nürnberg",
city:"Nürnberg",
location:"Messezentrum Nürnberg",
date:"2026-03-08",
time:"09:30–18:00",
url:"https://www.freizeitmesse.de"
},

{
title:"Consumenta Nürnberg",
city:"Nürnberg",
location:"Messezentrum Nürnberg",
date:"2026-10-25",
time:"10:00–18:00",
url:"https://www.consumenta.de"
},

{
title:"CMT Stuttgart",
city:"Stuttgart",
location:"Messe Stuttgart",
date:"2026-01-18",
time:"10:00–18:00",
url:"https://www.messe-stuttgart.de/cmt"
}

]


/* ANNUAL EVENTS */

const annualEvents=[

{title:"Haller Frühling",city:"Schwäbisch Hall",url:"https://www.schwaebischhall.de"},
{title:"Kuchen & Brunnenfest",city:"Schwäbisch Hall",url:"https://www.schwaebischhall.de"},
{title:"Jakobimarkt",city:"Schwäbisch Hall",url:"https://www.schwaebischhall.de"},
{title:"Sommernachtsfest",city:"Schwäbisch Hall",url:"https://www.schwaebischhall.de"},
{title:"Crailsheimer Volksfest",city:"Crailsheim",url:"https://www.crailsheim.de"}

]


/* WEEKLY MARKETS */

const weeklyMarkets=[

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



/* LAKES */

const lakes=[

{
title:"Altmühlsee Veranstaltungen",
city:"Gunzenhausen",
url:"https://www.altmuehlsee.de"
},

{
title:"Brombachsee Veranstaltungen",
city:"Ramsberg",
url:"https://www.fraenkisches-seenland.de"
}

]



const todayStart=startOfDay(now)

let week=[]
let upcoming=[]

eventDB.forEach(e=>{

if(!e.date){
upcoming.push(e)
return
}

const d=startOfDay(new Date(e.date))

if(inRange(d,todayStart,endOfWeek(now))){
week.push(e)
}else{
upcoming.push(e)
}

})

const events={
week,
upcoming,
markets:weeklyMarkets,
annual:annualEvents,
lakes
}



/* =======================================================
TRAVEL
======================================================= */

const travel={

title:"Altmühlsee – Fränkisches Seenland",
text:"Radfahren, Segeln oder entspannter Spaziergang am Seeufer.",
url:"https://www.fraenkisches-seenland.de"

}

/* ======================
RECIPE ROTATION
====================== */

const day = Math.floor(Date.now()/86400000)
const seed = 23

const recipe = recipes[(day * seed) % recipes.length]

/* =======================================================
LANGUAGE ROTATION
======================================================= */

const languageIndex =
Math.floor(Date.now()/86400000) % languages.length

const language = [languages[languageIndex]]


/*=======================================================
UKULELE
======================================================= */

   
/* =======================================================
QUOTE
======================================================= */

 const quoteSeed = 37
const quote = quotes[(day * quoteSeed) % quotes.length]

/* =======================================================
RESPONSE
======================================================= */
res.status(200).json({

version:fullVersion,
news,
regional,
events,
markets,
crypto:{bitcoin,nexo},
weather,
travel,
recipe,
language,
ukulele: ukuleleSongs.length 
? ukuleleSongs[Math.floor(Date.now()/86400000)%ukuleleSongs.length]
: null,
quote

})

}
