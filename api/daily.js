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

/* LANGUAGE ROTATION */

const languageDB=[

{en:"Where is the market?",es:"¿Dónde está el mercado?",de:"Wo ist der Markt?"},
{en:"Where is the bus stop?",es:"¿Dónde está la parada de autobús?",de:"Wo ist die Bushaltestelle?"},
{en:"Where is the train station?",es:"¿Dónde está la estación de tren?",de:"Wo ist der Bahnhof?"},
{en:"Where is the beach?",es:"¿Dónde está la playa?",de:"Wo ist der Strand?"},
{en:"Where is the restroom?",es:"¿Dónde está el baño?",de:"Wo ist die Toilette?"},
{en:"How much does this cost?",es:"¿Cuánto cuesta esto?",de:"Was kostet das?"},
{en:"Two coffees please",es:"Dos cafés por favor",de:"Zwei Kaffee bitte"},
{en:"A glass of water please",es:"Un vaso de agua por favor",de:"Ein Glas Wasser bitte"},
{en:"Can we pay here?",es:"¿Podemos pagar aquí?",de:"Können wir hier bezahlen?"},
{en:"Do you speak English?",es:"¿Habla inglés?",de:"Sprechen Sie Englisch?"},

{en:"What time is it?",es:"¿Qué hora es?",de:"Wie spät ist es?"},
{en:"What time does it start?",es:"¿A qué hora empieza?",de:"Wann beginnt es?"},
{en:"Where can we eat?",es:"¿Dónde podemos comer?",de:"Wo können wir essen?"},
{en:"Where can we dance?",es:"¿Dónde podemos bailar?",de:"Wo können wir tanzen?"},
{en:"Is there live music tonight?",es:"¿Hay música en vivo esta noche?",de:"Gibt es heute Live-Musik?"},
{en:"I like this place",es:"Me gusta este lugar",de:"Ich mag diesen Ort"},
{en:"This is delicious",es:"Esto está delicioso",de:"Das ist lecker"},
{en:"Another one please",es:"Otro por favor",de:"Noch einen bitte"},
{en:"Cheers!",es:"¡Salud!",de:"Prost!"},
{en:"Let's dance",es:"Vamos a bailar",de:"Lass uns tanzen"},

{en:"Where are you from?",es:"¿De dónde eres?",de:"Woher kommst du?"},
{en:"I am from Germany",es:"Soy de Alemania",de:"Ich komme aus Deutschland"},
{en:"Nice to meet you",es:"Mucho gusto",de:"Freut mich"},
{en:"What is your name?",es:"¿Cómo te llamas?",de:"Wie heißt du?"},
{en:"My name is Claudia",es:"Me llamo Claudia",de:"Ich heiße Claudia"},
{en:"How are you?",es:"¿Cómo estás?",de:"Wie geht es dir?"},
{en:"Very good",es:"Muy bien",de:"Sehr gut"},
{en:"Not bad",es:"No está mal",de:"Nicht schlecht"},
{en:"See you later",es:"Hasta luego",de:"Bis später"},
{en:"Good night",es:"Buenas noches",de:"Gute Nacht"},

{en:"Where is the harbor?",es:"¿Dónde está el puerto?",de:"Wo ist der Hafen?"},
{en:"Can we rent a boat?",es:"¿Podemos alquilar un barco?",de:"Können wir ein Boot mieten?"},
{en:"The sea is beautiful",es:"El mar es hermoso",de:"Das Meer ist wunderschön"},
{en:"Let's go sailing",es:"Vamos a navegar",de:"Lass uns segeln"},
{en:"I like snorkeling",es:"Me gusta hacer snorkel",de:"Ich schnorchle gern"},
{en:"I like diving",es:"Me gusta bucear",de:"Ich tauche gern"},
{en:"Where is the campsite?",es:"¿Dónde está el camping?",de:"Wo ist der Campingplatz?"},
{en:"Do you have electricity?",es:"¿Tiene electricidad?",de:"Haben Sie Strom?"},
{en:"One night please",es:"Una noche por favor",de:"Eine Nacht bitte"},
{en:"We stay two nights",es:"Nos quedamos dos noches",de:"Wir bleiben zwei Nächte"},

{en:"Where is the city center?",es:"¿Dónde está el centro?",de:"Wo ist das Stadtzentrum?"},
{en:"Is it far?",es:"¿Está lejos?",de:"Ist es weit?"},
{en:"Let's take a taxi",es:"Tomemos un taxi",de:"Nehmen wir ein Taxi"},
{en:"Call a taxi please",es:"Llame un taxi por favor",de:"Rufen Sie bitte ein Taxi"},
{en:"Which bus goes there?",es:"¿Qué autobús va allí?",de:"Welcher Bus fährt dorthin?"},
{en:"Which platform?",es:"¿Qué andén?",de:"Welches Gleis?"},
{en:"Where is the ticket office?",es:"¿Dónde está la taquilla?",de:"Wo ist der Ticketschalter?"},
{en:"One ticket please",es:"Un billete por favor",de:"Eine Fahrkarte bitte"},
{en:"Return ticket please",es:"Billete de ida y vuelta",de:"Hin- und Rückticket bitte"},
{en:"Next stop please",es:"Próxima parada por favor",de:"Nächste Haltestelle bitte"},

{en:"What do you recommend?",es:"¿Qué recomienda?",de:"Was empfehlen Sie?"},
{en:"The menu please",es:"La carta por favor",de:"Die Speisekarte bitte"},
{en:"Without onions please",es:"Sin cebolla por favor",de:"Ohne Zwiebeln bitte"},
{en:"A beer please",es:"Una cerveza por favor",de:"Ein Bier bitte"},
{en:"Red wine please",es:"Vino tinto por favor",de:"Rotwein bitte"},
{en:"White wine please",es:"Vino blanco por favor",de:"Weißwein bitte"},
{en:"The bill please",es:"La cuenta por favor",de:"Die Rechnung bitte"},
{en:"Together or separate?",es:"¿Juntos o separado?",de:"Zusammen oder getrennt?"},
{en:"Keep the change",es:"Quédese con el cambio",de:"Stimmt so"},
{en:"Thank you very much",es:"Muchas gracias",de:"Vielen Dank"}

]

const dayIndex=now.getDate()%languageDB.length

const language=[
languageDB[dayIndex],
languageDB[(dayIndex+1)%languageDB.length]
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
