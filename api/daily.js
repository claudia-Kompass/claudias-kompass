const ukuleleSongs = require("./data/ukulele")
const quotes = require("./data/quotes")
const recipes = require("./data/recipes")
const languages = require("./data/languages")
const eventDB = require("./data/events")

let rssCache = null
let rssCacheTime = 0

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

const version="31.0"+Math.floor(Date.now()/86400000)
const build=(process.env.VERCEL_GIT_COMMIT_SHA||"local").slice(0,7)
const fullVersion=version+"."+build

const now=new Date()


async function fetchTimeout(url,ms=2500){

try{

const controller = new AbortController()
const id = setTimeout(()=>controller.abort(),ms)

const res = await fetch(url,{signal:controller.signal})

clearTimeout(id)

if(!res.ok) return null

return res

}catch(e){

return null

}

}


function parseRSS(xml,source){
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


/* =======================================================
DATA CONTAINER
======================================================= */

let weather={temp:0,code:0,trend:{morning:{temp:0,code:0},afternoon:{temp:0,code:0},evening:{temp:0,code:0}}}

let bitcoin={usd:0,eur:0,usd_24h_change:0}
let nexo={usd:0,eur:0,usd_24h_change:0}

let news=[]
let regional=[]
let regionalBusiness=[]


/* =======================================================
API FETCH
======================================================= */

try{

const results = await Promise.allSettled([

fetchTimeout("https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current=temperature_2m,weathercode&hourly=temperature_2m,weathercode"),

fetchTimeout("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true"),

fetchTimeout("https://www.tagesschau.de/xml/rss2/"),

fetchTimeout("https://www.spiegel.de/schlagzeilen/tops/index.rss"),

fetchTimeout("https://www.n-tv.de/rss"),

fetchTimeout("https://www.reuters.com/world/rss"),

fetchTimeout("https://feeds.bbci.co.uk/news/world/rss.xml"),

fetchTimeout("https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml"),

fetchTimeout("https://www.stuttgarter-zeitung.de/rss"),

fetchTimeout("https://www.stimme.de/rss/"),

fetchTimeout("https://www.swp.de/crailsheim/rss.xml")

])

const [
weatherRes,
cryptoRes,
tagesschauRes,
spiegelRes,
ntvRes,
reutersRes,
bbcRes,
regionalRes,
stzRes,
stimmeRes,
htRes
] = results.map(r => r.status==="fulfilled" ? r.value : null)


/* WEATHER */

if(weatherRes && weatherRes.json){

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

if(rssCache && Date.now() - rssCacheTime < 600000){

news = rssCache.news
regional = rssCache.regional
regionalBusiness = rssCache.regionalBusiness

}else{

   
/* NEWS */

let collected = []

/* deutsche Quellen zuerst */

if(tagesschauRes){
const xml = await tagesschauRes.text()
collected = collected.concat(parseRSS(xml,"Tagesschau"))
}

if(spiegelRes){
const xml = await spiegelRes.text()
collected = collected.concat(parseRSS(xml,"Spiegel"))
}

/* internationale Quellen */

if(ntvRes){
const xml = await ntvRes.text()
collected = collected.concat(parseRSS(xml,"n-tv"))
}

if(reutersRes){
const xml = await reutersRes.text()
collected = collected.concat(parseRSS(xml,"Reuters"))
}

if(bbcRes){
const xml = await bbcRes.text()
collected = collected.concat(parseRSS(xml,"BBC"))
}

/* Reihenfolge stabilisieren */

const priority = {
"Tagesschau":1,
"Spiegel":2,
"n-tv":3,
"Reuters":4,
"BBC":5
}

collected.sort((a,b)=>priority[a.source]-priority[b.source])

/* maximal 5 Nachrichten */

const result=[]
const count={}
const seen=new Set()

for(const item of collected){

if(seen.has(item.title)) continue

count[item.source] = (count[item.source]||0)+1

if(count[item.source] <= 2){
result.push(item)
seen.add(item.title)
}

if(result.length===5) break
}

news = result

/* REGIONAL */

let regionalCollected=[]
let businessCollected=[]

const regionalCompanies=[
"würth",
"recaro",
"optima",
"schubert",
"bürger",
"ziehl-abegg",
"bausparkasse schwäbisch hall",
"stadtwerke schwäbisch hall",
"ebm-papst",
"voith",
"ritter sport",
"bosch",
"lidl",
"kaufland",
"dhl"
]

const regionalPlaces=[
"schwäbisch hall",
"crailsheim",
"künzelsau",
"hohenlohe",
"hohenlohekreis"
]

function isRegionalBusiness(title){

const t=title.toLowerCase()

if(regionalCompanies.some(k=>t.includes(k))) return true

if(regionalPlaces.some(k=>t.includes(k)) &&
(
t.includes("firma") ||
t.includes("unternehmen") ||
t.includes("produktion") ||
t.includes("invest") ||
t.includes("expand")
)){
return true
}

return false
}


/* SWR BADEN WÜRTTEMBERG */

if(regionalRes){

const xml = await regionalRes.text()
const items = parseRSS(xml,"SWR Baden-Württemberg")

for(const item of items){

if(isRegionalBusiness(item.title)){
businessCollected.push(item)
}else{
regionalCollected.push(item)
}

}

}


/* STUTTGARTER ZEITUNG */

if(stzRes){

const xml = await stzRes.text()
const items = parseRSS(xml,"Stuttgarter Zeitung")

for(const item of items){

if(isRegionalBusiness(item.title)){
businessCollected.push(item)
}else{
regionalCollected.push(item)
}

}

}


/* HEILBRONNER STIMME */

if(stimmeRes){

const xml = await stimmeRes.text()
const items = parseRSS(xml,"Heilbronner Stimme")

for(const item of items){

if(isRegionalBusiness(item.title)){
businessCollected.push(item)
}else{
regionalCollected.push(item)
}

}

}


/* HOHENLOHER TAGBLATT */

if(htRes){

const xml = await htRes.text()
const items = parseRSS(xml,"Hohenloher Tagblatt")

for(const item of items){

if(isRegionalBusiness(item.title)){
businessCollected.push(item)
}else{
regionalCollected.push(item)
}

}

}


/* DUPLIKATE ENTFERNEN */

const regionalResult=[]
const regionalSeen=new Set()

for(const item of regionalCollected){

if(regionalSeen.has(item.title)) continue

regionalResult.push(item)
regionalSeen.add(item.title)

if(regionalResult.length===4) break

}

regional = regionalResult


const businessResult=[]
const businessSeen=new Set()

for(const item of businessCollected){

if(businessSeen.has(item.title)) continue

businessResult.push(item)
businessSeen.add(item.title)

if(businessResult.length===3) break

}

regionalBusiness = businessResult
rssCache = {
news,
regional,
regionalBusiness
}

rssCacheTime = Date.now()
}


/* =========================================
   MARKET DATE LOGIC
========================================= */

const today = new Date()

let marketDate = new Date(today)

const day = today.getDay()

// Sonntag
if(day === 0){
marketDate.setDate(today.getDate()-2)
}

// Samstag
if(day === 6){
marketDate.setDate(today.getDate()-1)
}

const marketDateString =
marketDate.toLocaleDateString("de-DE")

   
/* =======================================================
MARKETS
======================================================= */

const markets={
dax:{
value:"18.742",
date:marketDateString
},
eurusd:{
value:"1.08",
date:marketDateString
}
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

function resolveDate(e){

const now=new Date()

if(e.date){
return new Date(e.date)
}

if(e.month && e.day){

let d=new Date(now.getFullYear(),e.month-1,e.day)

if(d < startOfDay(now)){
d=new Date(now.getFullYear()+1,e.month-1,e.day)
}

return d
}

return null
}

/* ======================
MOVABLE EVENTS
====================== */

function getSecondSunday(month){

const now=new Date()
const year=now.getFullYear()

let d=new Date(year,month-1,1)

while(d.getDay()!==0){
d.setDate(d.getDate()+1)
}

d.setDate(d.getDate()+7)

return d
}

function getAdventMarkets(){

const now=new Date()
const year=now.getFullYear()

let d=new Date(year,11,24)

while(d.getDay()!==0){
d.setDate(d.getDate()-1)
}

const firstAdvent=new Date(d)
firstAdvent.setDate(d.getDate()-21)

return [

{
title:"Weihnachtsmarkt Schwäbisch Hall",
city:"Schwäbisch Hall",
location:"Marktplatz",
address:"Marktplatz 1, 74523 Schwäbisch Hall",
date:firstAdvent.toISOString().split("T")[0],
time:"11:00–20:00"
}

]

}

function movableEvents(){

const now=new Date()
const list=[]

/* Verkaufsoffener Sonntag */

const verkaufsoffen=getSecondSunday(4)

if(verkaufsoffen>=startOfDay(now)){

list.push({

title:"Verkaufsoffener Sonntag",
city:"Schwäbisch Hall",
location:"Innenstadt",
address:"Marktplatz 1, 74523 Schwäbisch Hall",
date:verkaufsoffen.toISOString().split("T")[0],
time:"13:00–18:00"

})

}

/* Weihnachtsmarkt nur ab November */

if(now.getMonth()>=10){

list.push(...getAdventMarkets())

}

return list

}

/* ======================
WEEKLY MARKETS
====================== */

const weeklyMarkets=[

{
title:"Wochenmarkt Schwäbisch Hall",
city:"Schwäbisch Hall",
location:"Marktplatz",
address:"Marktplatz 1, 74523 Schwäbisch Hall",
weekday:[3,6],
time:"07:00–13:00"
},

{
title:"Wochenmarkt Crailsheim",
city:"Crailsheim",
location:"Marktplatz",
address:"Marktplatz 1, 74564 Crailsheim",
weekday:[6],
time:"07:00–13:00"
}

]

/* ======================
ENGINE
====================== */

const todayStart=startOfDay(now)
const weekEnd=endOfWeek(now)

let todayEvents=[]
let week=[]

const allEvents=[

...(Array.isArray(eventDB)?eventDB:[]),
...movableEvents()

]

allEvents.forEach(e=>{

const d=resolveDate(e)
if(!d)return

const eventDate=startOfDay(d)

const event={

title:e.title,
city:e.city,
date:d.toISOString().split("T")[0],
time:e.time||"",
location:e.location||"",
url:e.url||"",
maps:e.address
?`https://maps.google.com/?q=${encodeURIComponent(e.address)}`
:""

}

if(eventDate.getTime()===todayStart.getTime()){
todayEvents.push(event)
}

else if(eventDate>=todayStart && eventDate<=weekEnd){
week.push(event)
}

})

/* ======================
TODAY MARKETS
====================== */

const weekday=now.getDay()||7

const marketsToday=weeklyMarkets
.filter(m=>m.weekday.includes(weekday))
.map(m=>({

title:m.title,
city:m.city,
time:m.time,
location:m.location,
maps:`https://maps.google.com/?q=${encodeURIComponent(m.address)}`

}))

const events={
today:todayEvents,
week,
marketsToday
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

const dayIndex = Math.floor(Date.now()/86400000)
const seed = 23

const recipe = recipes[(dayIndex * seed) % recipes.length]

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
const quote = quotes[(dayIndex * quoteSeed) % quotes.length]

/* =======================================================
RESPONSE
======================================================= */
res.status(200).json({

version:fullVersion,

news,
regional,
regionalBusiness,

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

}catch(err){

console.error("API ERROR",err)

res.status(500).json({
error:"api_failed"
})

}

}
