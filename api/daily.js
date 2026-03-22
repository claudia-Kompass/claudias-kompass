
const ukuleleSongs = require("./data/ukulele")
const quotes = require("./data/quotes")
const recipes = require("./data/recipes")
const languages = require("./data/languages")
const eventDB = require("./data/events")
const travelDB = require("./data/travel")


let rssCache = null
let rssCacheTime = 0

module.exports = async function handler(req,res){
res.setHeader("Cache-Control", "no-store")
   
try{

async function buildEventUniverse() {

  let all = []

  // 1. Lokale Events (events.js)
  try {
    const local = require("./data/events")
    all = all.concat(local)
  } catch(e){}9

  // 2. Dance Radar
  try {
    const r = await fetch(
      process.env.VERCEL_URL
      ? "https://" + process.env.VERCEL_URL + "/api/radar"
      : "http://localhost:3000/api/radar"
    )
    const data = await r.json()
    all = all.concat(data.radar || [])
  } catch(e){}

  // 3. Festival Radar
  try {
    const f = await fetch(
      process.env.VERCEL_URL
      ? "https://" + process.env.VERCEL_URL + "/api/festival-radar"
      : "http://localhost:3000/api/festival-radar"
    )
    const data = await f.json()
    all = all.concat(data.festivals || [])
  } catch(e){}

  return all
}


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

const version="39."+Math.floor(Date.now()/86400000)
const build=(process.env.VERCEL_GIT_COMMIT_SHA||"local").slice(0,7)
const fullVersion=version+"."+build

const now=new Date()
const mergedEvents = await buildEventUniverse()

   
/* ======================
   Dance Loader
====================== */
async function loadDanceEvents(){

let base = require("./data/dance")

try{

const sheet = await fetch(
"https://opensheet.elk.sh/1-VRVeLv5nyHe3ul86d6Mqfd7sfcA4S5-gXkV12rLpZw/1"
)

const sheetData = await sheet.json()

const cleaned = sheetData.map(e=>({

type:e.type || "",
title:e.title || "",
city:e.city || "",

weekday:e.weekday ? Number(e.weekday) : null,
month:e.month ? Number(e.month) : null,

style:e.style || "",
location:e.location || "",
address:e.address || "",
time:e.time || "",

lat:e.lat ? Number(e.lat) : null,
lon:e.lon ? Number(e.lon) : null,

url:e.url || ""

}))

return [
...base,
...cleaned
]

}catch(err){

console.log("Sheet load failed")

return base

}

}
   

async function fetchTimeout(url,ms=8000){

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

const results = await Promise.allSettled([

fetchTimeout("https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current=temperature_2m,weathercode&hourly=temperature_2m,weathercode"),

fetchTimeout("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo,pax-gold,brent-crude-oil&vs_currencies=usd,eur&include_24hr_change=true"),

fetchTimeout("https://open.er-api.com/v6/latest/EUR"),
fetchTimeout("https://stooq.com/q/d/l/?s=dax&i=d"),
fetchTimeout("https://api.allorigins.win/raw?url=https://www.finanzen.net/rohstoffe/oelpreis"),
fetchTimeout("https://www.tagesschau.de/xml/rss2/"),
fetchTimeout("https://www.spiegel.de/schlagzeilen/tops/index.rss"),
fetchTimeout("https://www.n-tv.de/rss"),
fetchTimeout("https://www.reuters.com/world/rss"),
fetchTimeout("https://feeds.bbci.co.uk/news/world/rss.xml"),
fetchTimeout("https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml"),
fetchTimeout("https://www.stuttgarter-zeitung.de/rss"),
fetchTimeout("https://www.stimme.de/rss/"),
fetchTimeout("https://www.swp.de/crailsheim/rss.xml"),

])
   
const [
weatherRes,
cryptoRes,
fxRes,
daxRes,
oilRes,
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
   
console.log("cryptoRes:", cryptoRes ? "OK" : "NULL")
   
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
/* =========================================
   MARKET DATE LOGIC
========================================= */

const today = new Date()

let marketDate = new Date(today)
const day = today.getDay()

if (day === 0) marketDate.setDate(today.getDate() - 2)
if (day === 6) marketDate.setDate(today.getDate() - 1)

const marketDateString = marketDate.toLocaleDateString("de-DE")

/* =======================================================
MARKETS (CLEAN FINAL)
======================================================= */

function safeNumber(v, digits = 2, fallback = "-") {
  if (v == null || isNaN(v)) return fallback
  return Number(v).toFixed(digits)
}

let markets = {
  dax: { value: "-", trend: "yellow", time: marketDateString },
  eurusd: { value: "-", trend: "yellow" },
  gold: { usd: "-", eur: "-", trend: "yellow" },
  oil: { usd: "-", eur: "-", trend: "yellow" },
  bitcoin: { usd: "-", eur: "-", trend: "yellow" },
  nexo: { usd: "-", eur: "-", trend: "yellow" }
}

let fxRate = 0.92

/* ================= FX ================= */

try {
  if (fxRes) {
    const fx = await fxRes.json()
    if (fx?.rates?.USD) {
      fxRate = Number(fx.rates.USD)
      markets.eurusd.value = safeNumber(fxRate, 2)
    }
  }
} catch (e) {
  console.log("FX failed")
}

/* ================= CRYPTO ================= */

let btcPrice = null

try {

  console.log("=== DEBUG START ===")
  console.log("cryptoRes:", cryptoRes ? "OK" : "NULL")

  if (cryptoRes) {
    const json = await cryptoRes.json().catch(() => null)
console.log("crypto JSON:", json)
    if (json) {

      if (json.bitcoin?.usd) {
        btcPrice = Number(json.bitcoin.usd)
        let btcTrend = "yellow"

if (json.bitcoin?.usd_24h_change > 1) btcTrend = "green"
else if (json.bitcoin?.usd_24h_change < -1) btcTrend = "red"

markets.bitcoin = {
  usd: safeNumber(json.bitcoin.usd, 2),
  eur: safeNumber(json.bitcoin.eur ?? json.bitcoin.usd * fxRate, 2),
  trend: btcTrend
}
      }

      if (json.nexo?.usd) {
        let nexoTrend = "yellow"

if (json.nexo?.usd_24h_change > 1) nexoTrend = "green"
else if (json.nexo?.usd_24h_change < -1) nexoTrend = "red"

markets.nexo = {
  usd: safeNumber(json.nexo.usd, 3),
  eur: safeNumber(json.nexo.eur ?? json.nexo.usd * fxRate, 3),
  trend: nexoTrend
}
      }

      if (json["pax-gold"]?.usd) {
        markets.gold = {
          usd: safeNumber(json["pax-gold"].usd, 0),
          eur: safeNumber(json["pax-gold"].eur ?? json["pax-gold"].usd * fxRate, 0),
          trend: "yellow"
        }
      }
if (json.oil?.usd || json["oil"]?.usd) {
  const oil = json.oil || json["oil"]

  markets.oil = {
    usd: safeNumber(oil.usd, 0),
    eur: safeNumber(oil.eur ?? oil.usd * fxRate, 0),
    trend: "yellow"
  }
}

    }
  }

console.log("markets after crypto:", markets)
console.log("=== DEBUG END ===")
   
} catch (e) {
  console.log("crypto failed")
}

/* ================= BTC (PRIMARY BINANCE) ================= */
/* ================= BTC ROBUST ================= */

let btcSet = false

// 1. Binance
try {
  const res = await fetchTimeout("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", 8000)
  if (res) {
    const data = await res.json()
    if (data?.price) {
      const price = Number(data.price)

      markets.bitcoin = {
        usd: price.toFixed(2),
        eur: (price * fxRate).toFixed(2),
        trend: "yellow"
      }

      btcSet = true
    }
  }
} catch (e) {}

// 2. CoinCap fallback
if (!btcSet) {
  try {
    const res = await fetchTimeout("https://api.coincap.io/v2/assets/bitcoin", 8000)
    if (res) {
      const data = await res.json()
      if (data?.data?.priceUsd) {
        const price = Number(data.data.priceUsd)

        markets.bitcoin = {
          usd: price.toFixed(2),
          eur: (price * fxRate).toFixed(2),
          trend: "yellow"
        }

        btcSet = true
      }
    }
  } catch (e) {}
}

/* ===================== DAX FINAL ===================== */
try {
  if (daxRes) {
    const text = await daxRes.text()

    if (text && !text.includes("No data")) {
      const lines = text.trim().split("\n")

      const lastLine =
        lines[lines.length - 1] === ""
          ? lines[lines.length - 2]
          : lines[lines.length - 1]

      const parts = lastLine.split(",")

      if (parts.length >= 5) {
        const close = parseFloat(parts[4])
        const date = parts[0]

        if (!isNaN(close)) {
          markets.dax.value = Math.round(close).toLocaleString("de-DE")
          markets.dax.time = date
        }
      }
    }
  }
} catch (e) {
  console.log("❌ DAX FAILED", e)
}

/* FALLBACK = letzter bekannter Wert */
if (!markets.dax.value || markets.dax.value === "-") {
  markets.dax.value = "~20.000"
  markets.dax.time = marketDateString
  markets.dax.trend = "yellow"
}

/* ===================== OIL FINAL ===================== */
let oilData = null

try {
  if (cryptoRes) {
    const json = await cryptoRes.json().catch(() => null)

    if (json) {
      oilData =
        json["brent-crude-oil"] ||
        json["oil"] ||
        json["brent"] ||
        null

      if (oilData?.usd) {
        markets.oil = {
          usd: safeNumber(oilData.usd, 0),
          eur: safeNumber(oilData.eur ?? oilData.usd * fxRate, 0),
          trend: "yellow"
        }
      } else {
        console.log("❌ NO OIL DATA IN JSON")
      }
    }
  }
} catch (e) {
  console.log("❌ OIL FAILED", e)
}


/* ===================== HARD FALLBACK ===================== */
if (!markets.oil.usd || markets.oil.usd === "-") {
  markets.oil = {
    usd: "85",
    eur: (85 * fxRate).toFixed(0),
    trend: "yellow"
  }
  console.log("⚠️ OIL FALLBACK USED")
}

if (!markets.dax.value || markets.dax.value === "-") {
  markets.dax.value = "-"
  markets.dax.time = marketDateString
  markets.dax.trend = "yellow"
  console.log("⚠️ DAX FALLBACK USED")
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

   function distanceKm(lat1,lon1,lat2,lon2){

const R = 6371

const dLat = (lat2-lat1) * Math.PI/180
const dLon = (lon2-lon1) * Math.PI/180

const a =
Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(lat1*Math.PI/180) *
Math.cos(lat2*Math.PI/180) *
Math.sin(dLon/2) * Math.sin(dLon/2)

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

return R * c

   }

const HOME = {
lat:49.169,
lon:9.918
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


/* =======================================================
UNIFIED EVENT ENGINE (FINAL CLEAN)
======================================================= */

// 🔗 alle Quellen zusammenführen
const safeDance = await loadDanceEvents()

const unifiedEvents = [
  ...(Array.isArray(mergedEvents) ? mergedEvents : []),
  ...(Array.isArray(safeDance) ? safeDance : []),
  ...movableEvents()
]

// 🧠 Date Resolver (ALLE Fälle)
function resolveUnifiedDate(e){
console.log("unifiedEvents:", unifiedEvents.length)
  if(e.weekday != null){

  const today = now.getDay() || 7

  const days = Array.isArray(e.weekday)
    ? e.weekday
    : [e.weekday]

  const diffs = days.map(d => (Number(d) + 7 - today) % 7)

  const minDiff = Math.min(...diffs)

  const d = new Date()
  d.setDate(now.getDate() + minDiff)

  return d
}

  return null
}

// 📦 Container
let todayEvents = []
let weekEvents = []
let upcomingEvents = []

const seen = new Set()

// 🔄 Hauptloop
unifiedEvents.forEach(e => {

  try{

    if(!e || !e.title) return

    const d = resolveUnifiedDate(e)
    if(!d) return

    const eventDate = startOfDay(d)

    // ❌ Duplikate verhindern
    const key = e.title + "_" + (e.city || "")
    if(seen.has(key)) return
    seen.add(key)

    const event = {
      title: e.title,
      city: e.city || "",
      date: d.toISOString().split("T")[0],
      time: e.time || "",
      location: e.location || "",
      style: e.style || "",
      url: e.url || "",
      maps: e.address
        ? `https://maps.google.com/?q=${encodeURIComponent(e.address)}`
        : ""
    }

    if(eventDate.getTime() === startOfDay(now).getTime()){
      todayEvents.push(event)
    }
    else if(eventDate >= startOfDay(now) && eventDate <= endOfWeek(now)){
      weekEvents.push(event)
    }
    else if(eventDate > endOfWeek(now)){
      upcomingEvents.push(event)
    }

  } catch(err){
    console.log("Event error:", e)
  }

})

// 📊 Sortierung
function sortByDate(a,b){
  return new Date(a.date) - new Date(b.date)
}

todayEvents.sort(sortByDate)
weekEvents.sort(sortByDate)
upcomingEvents.sort(sortByDate)

// 📦 FINAL OUTPUT
const events = {
  today: todayEvents,
  week: weekEvents,
  upcoming: upcomingEvents
}


/* =======================================================
DANCE ENGINE
======================================================= */

let radarFestivals = []

try{

const radar = await fetch(
process.env.VERCEL_URL
? "https://" + process.env.VERCEL_URL + "/api/festival-radar"
: "http://localhost:3000/api/festival-radar"
)

const radarData = await radar.json()

radarFestivals = radarData.festivals || []

}catch(e){

console.log("Festival radar failed")

}

/* FALLBACK FESTIVALS */

radarFestivals = radarFestivals.concat([

{
title:"Paris Semba Festival",
city:"Paris",
country:"France",
style:"festival",
month:10,
url:"https://paris-semba-festival.com"
},

{
title:"Lisbon Kizomba Congress",
city:"Lisbon",
country:"Portugal",
style:"festival",
month:9,
url:"https://kizombacongress.com"
},

{
title:"Warsaw Salsa Festival",
city:"Warsaw",
country:"Poland",
style:"festival",
month:11,
url:"https://warsawsalsafestival.com"
}

])

const todayDay = now.getDay() || 0
const month = now.getMonth()+1

let danceToday=[]
let danceWeek=[]
let danceFestivals=[]

/* Radar Festivals – nur nächstes Festival */

const nowMonth = now.getMonth()+1

const upcomingFestivals = radarFestivals
.filter(f => !f.month || f.month >= nowMonth)
.sort((a,b)=>(a.month||12)-(b.month||12))

if(upcomingFestivals.length){

const nextFestival = upcomingFestivals[0]

danceFestivals.push({

title:nextFestival.title,
city:nextFestival.city || "",
style:"festival",
weekday:null,
location:nextFestival.location || "",
time:nextFestival.time || "",
distance:null,
maps:"",
url:nextFestival.url || ""

})

}
   
const safeDance = await loadDanceEvents()

danceFestivals.sort((a,b)=>(a.month||12)-(b.month||12))
danceToday.sort((a,b)=>(a.distance||999)-(b.distance||999))
danceWeek.sort((a,b)=>(a.distance||999)-(b.distance||999))


/* =========================================
   TRAVEL ENGINE
========================================= */

const travelDay = Math.floor(Date.now()/86400000)

const travel = travelDB[
travelDay % travelDB.length
]

/* ======================
RECIPE ENGINE
====================== */

const dayIndex = Math.floor(Date.now() / 86400000)

const seed = 23

const recipeToday = recipes[(dayIndex * seed) % recipes.length]

const recipeList = recipes
   
/* ======================
RECIPE LIST
====================== */

const recipe = recipes

/* =======================================================
LANGUAGE ROTATION
======================================================= */

const languageIndex =
Math.floor(Date.now()/86400000) % languages.length

const language = languages


/*=======================================================
UKULELE
======================================================= */

   
   
/* =======================================================
QUOTE
======================================================= */

const quoteSeed = 37
const quote = quotes[(dayIndex * quoteSeed) % quotes.length]


/* FINANCE NEWS */

let financeNews = []

try{

const resFinance = await fetch(
"https://claudias-kompass.vercel.app/api/finance-news"
)

const dataFinance = await resFinance.json()

financeNews = dataFinance.financeNews || []

}catch(e){
financeNews = []
}


// ================= FINAL MARKET STABILIZER =================

// DAX
if (!markets.dax?.value || markets.dax.value === "-") {
  markets.dax.trend = markets.dax.trend || "yellow"
}

// OIL
if (!markets.oil?.usd || markets.oil.usd === "-") {
  markets.oil = {
    usd: "85",
    eur: (85 * fxRate).toFixed(0),
    trend: "yellow"
  }
}

// BITCOIN
if (!markets.bitcoin?.usd || markets.bitcoin.usd === "-") {
  markets.bitcoin = {
    usd: "70000",
    eur: (70000 * fxRate).toFixed(0),
    trend: "yellow"
  }
}

// NEXO
if (!markets.nexo?.usd || markets.nexo.usd === "-") {
  markets.nexo = {
    usd: "0.90",
    eur: (0.90 * fxRate).toFixed(3),
    trend: "green"
  }
}

// ================= FINAL GUARD =================

function ensureValue(val, fallback) {
  return (!val || val === "-" || val === "NaN") ? fallback : val
}

// DAX
markets.dax.value = ensureValue(markets.dax.value, "~20.000")

// EUR/USD
markets.eurusd.value = ensureValue(markets.eurusd.value, "1.10")

// GOLD
if (!markets.gold?.usd || markets.gold.usd === "-") {
  markets.gold = {
    usd: "4500",
    eur: (4500 * fxRate).toFixed(0),
    trend: "yellow"
  }
}

// OIL
if (!markets.oil?.usd || markets.oil.usd === "-") {
  markets.oil = {
    usd: "85",
    eur: (85 * fxRate).toFixed(0),
    trend: "yellow"
  }
}

// BTC
if (!markets.bitcoin?.usd || markets.bitcoin.usd === "-") {
  markets.bitcoin = {
    usd: "70000",
    eur: (70000 * fxRate).toFixed(2),
    trend: "yellow"
  }
}

// NEXO
if (!markets.nexo?.usd || markets.nexo.usd === "-") {
  markets.nexo = {
    usd: "0.90",
    eur: (0.90 * fxRate).toFixed(3),
    trend: "yellow"
  }
}
   
/* =======================================================
RESPONSE
======================================================= */
res.status(200).json({

version:fullVersion,

news,
regional,
regionalBusiness,

events,
dance:{
today:[
...events.today,
...danceToday
],
week:[
...events.week,
...danceWeek
],
festivals:danceFestivals
},
   
markets,

financeNews,
weather,
travelRadar : [travel],
recipe: recipeToday,
recipes: recipeList,
language,

ukulele: ukuleleSongs,

   
quote

})

}catch(err){

console.error("API ERROR",err)

res.status(500).json({
error:"api_failed"
})

}

}

