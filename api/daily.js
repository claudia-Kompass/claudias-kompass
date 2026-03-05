/* ===========================
GLOBAL SOUL v27.1.0-STABLE
============================ */

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

const version="v27.1.0-STABLE"

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



/* =======================================================
AIRFRYER REZEPTE 
======================================================= */

const recipeDB=[

{title:"Paprika Feta",ingredients:["2 Paprika","50g Feta","1 EL Olivenöl"],description:"Paprika in Streifen schneiden, mit Öl mischen, Feta darüber bröseln.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Knusprige Zucchini",ingredients:["1 Zucchini","1 EL Olivenöl","2 EL Parmesan"],description:"Zucchini in Scheiben schneiden und mit Öl und Parmesan mischen.",temp:"200°C",time:"10 Minuten",portion:"2"},
{title:"Kartoffelwürfel Rosmarin",ingredients:["400g Kartoffeln","1 EL Olivenöl","Rosmarin"],description:"Kartoffeln würfeln, mit Öl und Rosmarin mischen.",temp:"200°C",time:"18 Minuten",portion:"2"},
{title:"Brokkoli Crunch",ingredients:["1 Brokkoli","1 EL Olivenöl","Knoblauch"],description:"Brokkoli in Röschen teilen und würzen.",temp:"190°C",time:"10 Minuten",portion:"2"},
{title:"Karotten Fries",ingredients:["3 Karotten","1 EL Olivenöl","Paprika"],description:"Karotten in Sticks schneiden und würzen.",temp:"200°C",time:"15 Minuten",portion:"2"},
{title:"Champignon Knoblauch",ingredients:["250g Champignons","1 EL Olivenöl","Knoblauch"],description:"Pilze halbieren und würzen.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Süßkartoffel Fries",ingredients:["1 Süßkartoffel","1 EL Öl","Paprika"],description:"Süßkartoffel in Sticks schneiden.",temp:"200°C",time:"16 Minuten",portion:"2"},
{title:"Zucchini Kräuter",ingredients:["1 Zucchini","1 EL Öl","ital. Kräuter"],description:"Zucchini in Scheiben schneiden und würzen.",temp:"200°C",time:"10 Minuten",portion:"2"},
{title:"Blumenkohl Bites",ingredients:["1 Blumenkohl","1 EL Öl","Currypulver"],description:"Blumenkohlröschen würzen.",temp:"190°C",time:"14 Minuten",portion:"2"},
{title:"Auberginen Würfel",ingredients:["1 Aubergine","1 EL Öl","Knoblauch"],description:"Aubergine würfeln und würzen.",temp:"200°C",time:"14 Minuten",portion:"2"},
{title:"Mini Kartoffeln",ingredients:["400g kleine Kartoffeln","1 EL Öl","Rosmarin"],description:"Kartoffeln halbieren und würzen.",temp:"200°C",time:"20 Minuten",portion:"2"},
{title:"Paprika Zucchini Mix",ingredients:["1 Paprika","1 Zucchini","1 EL Öl"],description:"Gemüse würfeln und mischen.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Brokkoli Parmesan",ingredients:["1 Brokkoli","1 EL Öl","Parmesan"],description:"Brokkoli mit Öl mischen und Parmesan darüber.",temp:"190°C",time:"10 Minuten",portion:"2"},
{title:"Karotten Honig",ingredients:["3 Karotten","1 TL Honig","1 TL Öl"],description:"Karotten in Sticks schneiden und mischen.",temp:"190°C",time:"15 Minuten",portion:"2"},
{title:"Kartoffelspalten",ingredients:["400g Kartoffeln","1 EL Öl","Paprika"],description:"Kartoffeln in Spalten schneiden und würzen.",temp:"200°C",time:"20 Minuten",portion:"2"},
{title:"Knoblauch Pilze",ingredients:["250g Champignons","1 EL Öl","Knoblauch"],description:"Pilze würzen und mischen.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Paprika Mix",ingredients:["2 Paprika","1 EL Öl","Kräuter"],description:"Paprika in Streifen schneiden.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Brokkoli Zitrone",ingredients:["1 Brokkoli","1 EL Öl","Zitronensaft"],description:"Brokkoli würzen.",temp:"190°C",time:"10 Minuten",portion:"2"},
{title:"Kartoffel Knoblauch",ingredients:["400g Kartoffeln","1 EL Öl","Knoblauch"],description:"Kartoffeln würfeln und würzen.",temp:"200°C",time:"18 Minuten",portion:"2"},
{title:"Zucchini Chips",ingredients:["1 Zucchini","2 EL Parmesan"],description:"Zucchini dünn schneiden und mit Parmesan bestreuen.",temp:"200°C",time:"8 Minuten",portion:"2"},
{title:"Blumenkohl Curry",ingredients:["1 Blumenkohl","1 EL Öl","Currypulver"],description:"Röschen würzen und mischen.",temp:"190°C",time:"15 Minuten",portion:"2"},
{title:"Paprika Feta Mix",ingredients:["2 Paprika","50g Feta"],description:"Paprika würfeln und Feta dazu.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Kartoffel Mix",ingredients:["300g Kartoffeln","1 Paprika","1 EL Öl"],description:"Alles würfeln und mischen.",temp:"200°C",time:"18 Minuten",portion:"2"},
{title:"Karotten Kräuter",ingredients:["3 Karotten","1 EL Öl","Kräuter"],description:"Karotten würzen.",temp:"190°C",time:"15 Minuten",portion:"2"},
{title:"Aubergine Kräuter",ingredients:["1 Aubergine","1 EL Öl","Kräuter"],description:"Aubergine würfeln.",temp:"200°C",time:"14 Minuten",portion:"2"},
{title:"Paprika Crunch",ingredients:["2 Paprika","1 EL Öl","Paprikapulver"],description:"Paprika würzen.",temp:"190°C",time:"12 Minuten",portion:"2"},
{title:"Brokkoli Knoblauch",ingredients:["1 Brokkoli","1 EL Öl","Knoblauch"],description:"Brokkoli würzen.",temp:"190°C",time:"10 Minuten",portion:"2"},
{title:"Kartoffel Parmesan",ingredients:["400g Kartoffeln","Parmesan","1 EL Öl"],description:"Kartoffeln würfeln und Parmesan darüber.",temp:"200°C",time:"18 Minuten",portion:"2"},
{title:"Karotten Sesam",ingredients:["3 Karotten","1 TL Sesam","1 TL Öl"],description:"Karotten mischen.",temp:"190°C",time:"15 Minuten",portion:"2"},
{title:"Gemüse Mix",ingredients:["Paprika","Zucchini","Brokkoli"],description:"Gemüse würfeln und würzen.",temp:"190°C",time:"14 Minuten",portion:"2"}

]

const recipeIndex=Math.floor(Date.now()/86400000)%recipeDB.length
const recipe=recipeDB[recipeIndex]






/* =======================================================
LANGUAGE ROTATION
======================================================= */

const languageDB=[

const languageDB=[

{en:"Where is the bus stop?",es:"¿Dónde está la parada de autobús?",de:"Wo ist die Bushaltestelle?"},
{en:"Where is the train station?",es:"¿Dónde está la estación?",de:"Wo ist der Bahnhof?"},
{en:"Where is the restroom?",es:"¿Dónde está el baño?",de:"Wo ist die Toilette?"},
{en:"Where can I buy tickets?",es:"¿Dónde puedo comprar billetes?",de:"Wo kann ich Tickets kaufen?"},
{en:"How much does this cost?",es:"¿Cuánto cuesta esto?",de:"Wie viel kostet das?"},
{en:"Do you accept card?",es:"¿Acepta tarjeta?",de:"Akzeptieren Sie Karte?"},
{en:"Cash only?",es:"¿Solo efectivo?",de:"Nur Bargeld?"},
{en:"Two coffees please.",es:"Dos cafés por favor.",de:"Zwei Kaffee bitte."},
{en:"One beer please.",es:"Una cerveza por favor.",de:"Ein Bier bitte."},
{en:"A glass of water please.",es:"Un vaso de agua por favor.",de:"Ein Glas Wasser bitte."},

{en:"I would like breakfast.",es:"Quiero desayunar.",de:"Ich möchte frühstücken."},
{en:"Is breakfast included?",es:"¿El desayuno está incluido?",de:"Ist Frühstück inklusive?"},
{en:"What time is breakfast?",es:"¿A qué hora es el desayuno?",de:"Wann ist Frühstück?"},
{en:"Is there WiFi?",es:"¿Hay wifi?",de:"Gibt es WLAN?"},
{en:"What is the WiFi password?",es:"¿Cuál es la contraseña del wifi?",de:"Wie ist das WLAN Passwort?"},
{en:"Can I pay here?",es:"¿Puedo pagar aquí?",de:"Kann ich hier bezahlen?"},
{en:"Can I sit here?",es:"¿Puedo sentarme aquí?",de:"Kann ich hier sitzen?"},
{en:"Is this seat free?",es:"¿Está libre este asiento?",de:"Ist dieser Platz frei?"},
{en:"Can I take this?",es:"¿Puedo llevar esto?",de:"Kann ich das nehmen?"},
{en:"Is this local food?",es:"¿Es comida local?",de:"Ist das lokale Küche?"},

{en:"Do you speak English?",es:"¿Habla inglés?",de:"Sprechen Sie Englisch?"},
{en:"I speak a little Spanish.",es:"Hablo un poco de español.",de:"Ich spreche ein wenig Spanisch."},
{en:"Could you repeat that?",es:"¿Puede repetir?",de:"Können Sie das wiederholen?"},
{en:"Please speak slowly.",es:"Por favor hable más despacio.",de:"Bitte langsamer sprechen."},
{en:"I understand.",es:"Entiendo.",de:"Ich verstehe."},
{en:"I do not understand.",es:"No entiendo.",de:"Ich verstehe nicht."},
{en:"Just a moment please.",es:"Un momento por favor.",de:"Einen Moment bitte."},
{en:"No problem.",es:"No hay problema.",de:"Kein Problem."},
{en:"Thank you very much.",es:"Muchas gracias.",de:"Vielen Dank."},
{en:"You're welcome.",es:"De nada.",de:"Gern geschehen."},

{en:"Good morning.",es:"Buenos días.",de:"Guten Morgen."},
{en:"Good afternoon.",es:"Buenas tardes.",de:"Guten Tag."},
{en:"Good evening.",es:"Buenas noches.",de:"Guten Abend."},
{en:"See you later.",es:"Hasta luego.",de:"Bis später."},
{en:"See you tomorrow.",es:"Hasta mañana.",de:"Bis morgen."},
{en:"Have a nice day.",es:"Que tenga buen día.",de:"Schönen Tag."},
{en:"Enjoy your meal.",es:"Buen provecho.",de:"Guten Appetit."},
{en:"Welcome!",es:"¡Bienvenido!",de:"Willkommen!"},
{en:"Nice to meet you.",es:"Encantado.",de:"Freut mich."},
{en:"How are you?",es:"¿Cómo estás?",de:"Wie geht es dir?"},

{en:"Where is the beach?",es:"¿Dónde está la playa?",de:"Wo ist der Strand?"},
{en:"Where is the harbor?",es:"¿Dónde está el puerto?",de:"Wo ist der Hafen?"},
{en:"Where is the market?",es:"¿Dónde está el mercado?",de:"Wo ist der Markt?"},
{en:"Where is the city center?",es:"¿Dónde está el centro?",de:"Wo ist das Zentrum?"},
{en:"Where is the supermarket?",es:"¿Dónde está el supermercado?",de:"Wo ist der Supermarkt?"},
{en:"Where is the pharmacy?",es:"¿Dónde está la farmacia?",de:"Wo ist die Apotheke?"},
{en:"Where is the hospital?",es:"¿Dónde está el hospital?",de:"Wo ist das Krankenhaus?"},
{en:"Where is the taxi?",es:"¿Dónde hay taxi?",de:"Wo gibt es ein Taxi?"},
{en:"Where can I rent a bike?",es:"¿Dónde puedo alquilar una bici?",de:"Wo kann ich ein Fahrrad mieten?"},
{en:"Where can I park?",es:"¿Dónde puedo aparcar?",de:"Wo kann ich parken?"},

{en:"Is it far?",es:"¿Está lejos?",de:"Ist es weit?"},
{en:"Is it near?",es:"¿Está cerca?",de:"Ist es nah?"},
{en:"Turn left.",es:"Gire a la izquierda.",de:"Links abbiegen."},
{en:"Turn right.",es:"Gire a la derecha.",de:"Rechts abbiegen."},
{en:"Go straight.",es:"Todo recto.",de:"Geradeaus gehen."},
{en:"Stop here please.",es:"Pare aquí por favor.",de:"Hier bitte anhalten."},
{en:"How long does it take?",es:"¿Cuánto tarda?",de:"Wie lange dauert es

const langIndex=Math.floor(Date.now()/86400000)%languageDB.length
const language=[languageDB[langIndex]]



/* =======================================================
UKULELE
======================================================= */

const ukulele={
song:"Pop Progression",
chords:"C – G – Am – F"
}



/* =======================================================
QUOTE
======================================================= */

const quote={
text:"Der Weg entsteht beim Gehen.",
author:"Franz Kafka"
}



/* =======================================================
RESPONSE
======================================================= */

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
