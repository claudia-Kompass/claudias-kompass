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

const version="25.0.0"

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

if(target==="21:00" && code===0){code=100}

return{temp:temps[index],code}

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
{title:"Genussmesse Heilbronn",city:"Heilbronn",date:"2026-03-07",time:"10:00–18:00",url:"https://redblue.de/"},
{title:"Freizeit Messe Nürnberg",city:"Nürnberg",date:"2026-03-08",time:"09:30–18:00",url:"https://www.freizeitmesse.de"}
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

/* LANGUAGE CATEGORIES + ROTATION */

const languageCategories={

travel:[

{en:"Where is the bus stop?",es:"¿Dónde está la parada de autobús?",de:"Wo ist die Bushaltestelle?"},
{en:"Where is the train station?",es:"¿Dónde está la estación de tren?",de:"Wo ist der Bahnhof?"},
{en:"Where is the airport?",es:"¿Dónde está el aeropuerto?",de:"Wo ist der Flughafen?"},
{en:"Where is the city center?",es:"¿Dónde está el centro?",de:"Wo ist das Stadtzentrum?"},
{en:"Where can I buy tickets?",es:"¿Dónde puedo comprar billetes?",de:"Wo kann ich Tickets kaufen?"},
{en:"Which bus goes there?",es:"¿Qué autobús va allí?",de:"Welcher Bus fährt dorthin?"},
{en:"How long does it take?",es:"¿Cuánto tarda?",de:"Wie lange dauert es?"},
{en:"Is it far?",es:"¿Está lejos?",de:"Ist es weit?"},
{en:"Left or right?",es:"¿Izquierda o derecha?",de:"Links oder rechts?"},
{en:"Straight ahead",es:"Todo recto",de:"Geradeaus"}

],

restaurant:[

{en:"Two coffees please",es:"Dos cafés por favor",de:"Zwei Kaffee bitte"},
{en:"The menu please",es:"La carta por favor",de:"Die Speisekarte bitte"},
{en:"A beer please",es:"Una cerveza por favor",de:"Ein Bier bitte"},
{en:"Red wine please",es:"Vino tinto por favor",de:"Rotwein bitte"},
{en:"White wine please",es:"Vino blanco por favor",de:"Weißwein bitte"},
{en:"This is delicious",es:"Esto está delicioso",de:"Das ist lecker"},
{en:"The bill please",es:"La cuenta por favor",de:"Die Rechnung bitte"},
{en:"Together or separate?",es:"¿Juntos o separado?",de:"Zusammen oder getrennt?"},
{en:"Keep the change",es:"Quédese con el cambio",de:"Stimmt so"},
{en:"Another one please",es:"Otro por favor",de:"Noch einen bitte"}

],

dance:[

{en:"Do you like salsa?",es:"¿Te gusta la salsa?",de:"Magst du Salsa?"},
{en:"Let's dance",es:"Vamos a bailar",de:"Lass uns tanzen"},
{en:"Do you want to dance?",es:"¿Quieres bailar?",de:"Möchtest du tanzen?"},
{en:"Great music tonight",es:"Gran música esta noche",de:"Tolle Musik heute Abend"},
{en:"Where can we dance?",es:"¿Dónde podemos bailar?",de:"Wo können wir tanzen?"},
{en:"I love this song",es:"Me encanta esta canción",de:"Ich liebe dieses Lied"},
{en:"One more dance?",es:"¿Otro baile?",de:"Noch ein Tanz?"},
{en:"You dance very well",es:"Bailas muy bien",de:"Du tanzt sehr gut"},
{en:"That was fun",es:"Fue divertido",de:"Das hat Spaß gemacht"},
{en:"See you on the dance floor",es:"Nos vemos en la pista",de:"Wir sehen uns auf der Tanzfläche"}

],

camping:[

{en:"Where is the campsite?",es:"¿Dónde está el camping?",de:"Wo ist der Campingplatz?"},
{en:"One night please",es:"Una noche por favor",de:"Eine Nacht bitte"},
{en:"Two nights please",es:"Dos noches por favor",de:"Zwei Nächte bitte"},
{en:"Do you have electricity?",es:"¿Tiene electricidad?",de:"Haben Sie Strom?"},
{en:"Where are the showers?",es:"¿Dónde están las duchas?",de:"Wo sind die Duschen?"},
{en:"Where is the lake?",es:"¿Dónde está el lago?",de:"Wo ist der See?"},
{en:"Beautiful nature here",es:"Hermosa naturaleza aquí",de:"Schöne Natur hier"},
{en:"Perfect for hiking",es:"Perfecto para caminar",de:"Perfekt zum Wandern"},
{en:"Let's make a fire",es:"Hagamos fuego",de:"Lass uns ein Feuer machen"},
{en:"Good night under the stars",es:"Buenas noches bajo las estrellas",de:"Gute Nacht unter den Sternen"}

],

smalltalk:[

{en:"Where are you from?",es:"¿De dónde eres?",de:"Woher kommst du?"},
{en:"I am from Germany",es:"Soy de Alemania",de:"Ich komme aus Deutschland"},
{en:"Nice to meet you",es:"Mucho gusto",de:"Freut mich"},
{en:"What is your name?",es:"¿Cómo te llamas?",de:"Wie heißt du?"},
{en:"My name is Claudia",es:"Me llamo Claudia",de:"Ich heiße Claudia"},
{en:"How are you?",es:"¿Cómo estás?",de:"Wie geht es dir?"},
{en:"Very good",es:"Muy bien",de:"Sehr gut"},
{en:"Not bad",es:"No está mal",de:"Nicht schlecht"},
{en:"See you later",es:"Hasta luego",de:"Bis später"},
{en:"Good night",es:"Buenas noches",de:"Gute Nacht"}

]

}

/* Kategorie Rotation */

const categoryKeys=Object.keys(languageCategories)

const dayIndex=Math.floor(Date.now()/86400000)

const category=categoryKeys[dayIndex%categoryKeys.length]

const list=languageCategories[category]

const sentenceIndex=dayIndex%list.length

const language=[
list[sentenceIndex],
list[(sentenceIndex+1)%list.length]
]

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
