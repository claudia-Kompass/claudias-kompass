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

const version="27.0.0"

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

/* DATA */

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

return{temp:temps[index],code}

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

/* MARKETS */

const markets={
dax:{value:"18.742",date:"Stand "+marketDate},
eurusd:{value:"1.08",date:"Stand "+marketDate}
}

/* EVENTS */

const events={
week:[
{title:"Genussmesse Heilbronn",city:"Heilbronn",date:"2026-03-07",time:"10:00–18:00"},
{title:"Freizeit Messe Nürnberg",city:"Nürnberg",date:"2026-03-08",time:"09:30–18:00"}
]
}

/* TRAVEL */

const travel={
title:"Altmühlsee – Fränkisches Seenland",
text:"Radfahren, Segeln oder entspannter Spaziergang am Seeufer.",
url:"https://www.fraenkisches-seenland.de"
}

/* AIRFRYER 60 REZEPTE */

const recipeDB=[]

for(let i=1;i<=60;i++){

recipeDB.push({

title:"Airfryer Rezept "+i,

ingredients:[
"1 Gemüse oder Protein",
"1 EL Olivenöl",
"Gewürze nach Geschmack"
],

description:"Schnelles Airfryer Gericht – außen knusprig, innen saftig.",

temp:"180-200°C",

time:"10-18 Minuten",

portion:"2"

})

}

const recipeIndex=Math.floor(Date.now()/86400000)%recipeDB.length
const recipe=recipeDB[recipeIndex]

/* LANGUAGE ENGINE */

const languageDB=[

{en:"Where is the bus stop?",es:"¿Dónde está la parada de autobús?",de:"Wo ist die Bushaltestelle?"},
{en:"Two coffees please",es:"Dos cafés por favor",de:"Zwei Kaffee bitte"},
{en:"How much does this cost?",es:"¿Cuánto cuesta esto?",de:"Wie viel kostet das?"},
{en:"Where is the restroom?",es:"¿Dónde está el baño?",de:"Wo ist die Toilette?"},
{en:"I would like a coffee.",es:"Quiero un café.",de:"Ich hätte gern einen Kaffee."},
{en:"Do you speak English?",es:"¿Habla inglés?",de:"Sprechen Sie Englisch?"},
{en:"Can I pay by card?",es:"¿Puedo pagar con tarjeta?",de:"Kann ich mit Karte bezahlen?"},
{en:"Where is the train station?",es:"¿Dónde está la estación?",de:"Wo ist der Bahnhof?"},
{en:"One moment please.",es:"Un momento por favor.",de:"Einen Moment bitte."},
{en:"See you tomorrow.",es:"Hasta mañana.",de:"Bis morgen."},

{en:"Where is the beach?",es:"¿Dónde está la playa?",de:"Wo ist der Strand?"},
{en:"I like this place.",es:"Me gusta este lugar.",de:"Mir gefällt dieser Ort."},
{en:"What time does it open?",es:"¿A qué hora abre?",de:"Wann öffnet es?"},
{en:"What time does it close?",es:"¿A qué hora cierra?",de:"Wann schließt es?"},
{en:"I need help.",es:"Necesito ayuda.",de:"Ich brauche Hilfe."},
{en:"Where can we dance?",es:"¿Dónde podemos bailar?",de:"Wo können wir tanzen?"},
{en:"The music is great.",es:"La música es genial.",de:"Die Musik ist großartig."},
{en:"Let's go dancing.",es:"Vamos a bailar.",de:"Lass uns tanzen gehen."},
{en:"This food is delicious.",es:"Esta comida es deliciosa.",de:"Dieses Essen ist köstlich."},
{en:"Can you recommend something?",es:"¿Puede recomendar algo?",de:"Können Sie etwas empfehlen?"}

]

const langIndex = Math.floor(Date.now()/86400000) % languageDB.length

const language=[ languageDB[langIndex] ]

/* UKULELE */

const ukulele={
song:"Pop Progression",
chords:"C – G – Am – F"
}

/* QUOTE */

const quote={
text:"Der Weg entsteht beim Gehen.",
author:"Franz Kafka"
}

/* RESPONSE */

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
