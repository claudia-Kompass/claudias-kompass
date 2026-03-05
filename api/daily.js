module.exports = async function handler(req, res) {

/* =========================
   SECURITY
========================= */

/* Cache */

res.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=600");

/* Security Headers */

res.setHeader("X-Content-Type-Options","nosniff");
res.setHeader("X-Frame-Options","DENY");
res.setHeader("X-XSS-Protection","1; mode=block");

/* Nur GET erlauben */

if(req.method !== "GET"){
  return res.status(405).end();
}

/* Origin Check (nur deine Seite darf zugreifen) */

const origin = req.headers.origin || "";

if(origin && !origin.includes("vercel.app")){
  return res.status(403).json({error:"Forbidden"});
}

/* Bot Protection */

const ua = req.headers["user-agent"] || "";

if(ua.length < 5){
  return res.status(403).json({error:"Bot blocked"});
}
   
const version = "23.0.0";
const now = new Date();
const timestamp = now.toLocaleString("de-DE");
const marketDate = now.toLocaleDateString("de-DE");

/* -----------------------------
   HELPERS
----------------------------- */

function fetchTimeout(url, ms=4000){
  return Promise.race([
    fetch(url),
    new Promise((_,reject)=>setTimeout(()=>reject("timeout"),ms))
  ]);
}

function normalizeTitle(title){
  return (title||"").toLowerCase().replace(/[^a-z0-9]/g,"");
}

function parseRSS(xml,source){
  const items=[];
  const matches=xml.match(/<item>([\s\S]*?)<\/item>/g)||[];

  matches.forEach(item=>{
    const t=item.match(/<title>(.*?)<\/title>/);
    const l=item.match(/<link>(.*?)<\/link>/);

    if(t && l){
      items.push({
        title:t[1].replace(/<!\[CDATA\[(.*?)\]\]>/,"$1"),
        url:l[1],
        source
      });
    }
  });

  return items;
}

function startOfDay(d){
  const x=new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function endOfWeek(d){
  const x=new Date(d);
  const day=x.getDay()||7;
  if(day!==7)x.setDate(x.getDate()+(7-day));
  x.setHours(23,59,59,999);
  return x;
}

function inRange(date,a,b){
  return date>=a && date<=b;
}

/* -----------------------------
   DEFAULT STRUCTURE
----------------------------- */

let weather={
  temp:0,
  code:0,
  trend:{
    morning:{temp:0,code:0},
    afternoon:{temp:0,code:0},
    evening:{temp:0,code:0}
  }
};

let bitcoin={usd:0,eur:0,usd_24h_change:0};
let nexo={usd:0,eur:0,usd_24h_change:0};
let news=[];
let regional=[];

/* -----------------------------
   PARALLEL DATA FETCH
----------------------------- */

try{

const [
  weatherRes,
  cryptoRes,
  tagesschauRes,
  spiegelRes,
  regionalRes
]=await Promise.all([

  fetchTimeout("https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&hourly=temperature_2m,weathercode&current_weather=true").catch(()=>null),

  fetchTimeout("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true").catch(()=>null),

  fetchTimeout("https://www.tagesschau.de/xml/rss2/").catch(()=>null),

  fetchTimeout("https://www.spiegel.de/schlagzeilen/tops/index.rss").catch(()=>null),

  fetchTimeout("https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml").catch(()=>null)

]);

/* -----------------------------
   WEATHER
----------------------------- */

if(weatherRes){
  const d=await weatherRes.json();

  weather.temp=d.current_weather?.temperature??0;
  weather.code=d.current_weather?.weathercode??0;

  const hours=d.hourly?.time||[];
  const temps=d.hourly?.temperature_2m||[];
  const codes=d.hourly?.weathercode||[];

  function findHour(t){
    const i=hours.findIndex(h=>h.includes(t));
    if(i>-1){
      return{temp:temps[i],code:codes[i]};
    }
    return{temp:0,code:0};
  }

  weather.trend.morning=findHour("09:00");
  weather.trend.afternoon=findHour("15:00");
  weather.trend.evening=findHour("21:00");
}

/* -----------------------------
   CRYPTO
----------------------------- */

if(cryptoRes){
  const d=await cryptoRes.json();
  if(d.bitcoin)bitcoin=d.bitcoin;
  if(d.nexo)nexo=d.nexo;
}

/* -----------------------------
   GLOBAL NEWS
----------------------------- */

let collected=[];

if(tagesschauRes){
  const xml=await tagesschauRes.text();
  collected=collected.concat(parseRSS(xml,"Tagesschau"));
}

if(spiegelRes){
  const xml=await spiegelRes.text();
  collected=collected.concat(parseRSS(xml,"Spiegel"));
}

news=collected
.filter((a,i,self)=>i===self.findIndex(b=>normalizeTitle(a.title)===normalizeTitle(b.title)))
.slice(0,5);

/* -----------------------------
   REGIONAL
----------------------------- */

if(regionalRes){
  const xml=await regionalRes.text();
  regional=parseRSS(xml,"SWR Baden-Württemberg").slice(0,4);
}

}catch(err){
console.error("FETCH ERROR",err);
}

/* -----------------------------
   MARKETS
----------------------------- */

const markets={
  dax:{value:"18.742",date:"Stand: "+marketDate},
  eurusd:{value:"1.08",date:"Stand: "+marketDate}
};

/* -----------------------------
   EVENT ENGINE
----------------------------- */

const eventDB=[

{title:"Genussmesse Heilbronn",city:"Heilbronn",location:"Redblue Messehalle",date:"2026-03-07",time:"10:00–18:00",url:"https://redblue.de/"},

{title:"Freizeit Messe Nürnberg",city:"Nürnberg",location:"Messezentrum Nürnberg",date:"2026-03-08",time:"09:30–18:00",url:"https://www.freizeitmesse.de"},

{title:"Consumenta Nürnberg",city:"Nürnberg",location:"Messezentrum Nürnberg",date:"2026-10-25",time:"10:00–18:00",url:"https://www.consumenta.de"}

];

const weeklyMarkets=[
{
title:"Wochenmarkt Schwäbisch Hall",
location:"Marktplatz Schwäbisch Hall",
day:"Mittwoch & Samstag",
time:"07:00–13:00"
}
];

const todayStart=startOfDay(now);

let week=[];
let upcoming=[];

eventDB.forEach(e=>{
if(!e.date){
upcoming.push(e);
return;
}

const d=startOfDay(new Date(e.date));

if(inRange(d,todayStart,endOfWeek(now))){
week.push(e);
}else{
upcoming.push(e);
}
});

const events={
week,
upcoming,
markets:weeklyMarkets
};

/* =========================
   PERSONAL MODULES
========================= */

/* TRAVEL */

const travel = {
title:"Altmühlsee – Fränkisches Seenland",
text:"Radfahren, Segeln oder entspannter Spaziergang am Seeufer. Ideal für einen spontanen Wochenend-Trip.",
image1:"/images/travel/altmuehlsee1.jpg",
image2:"/images/travel/altmuehlsee2.jpg",
url:"https://www.altmuehlsee.de",
category:"natur"
};


/* AIRFRYER */

const recipe = {
title:"Knusprige Zucchini",
ingredients:[
"1 Zucchini",
"Olivenöl",
"Parmesan",
"Pfeffer"
],
temperature:"200°C",
time:"10 Minuten",
tip:"Vor dem Airfryer leicht salzen damit Wasser austritt."
};


/* LANGUAGE */

const language = {
de:"Wo ist der Markt?",
en:"Where is the market?",
es:"¿Dónde está el mercado?"
};


/* UKULELE */

const ukulele = {
chords:"C – G – Am – F",
tip:"Langsam im 4/4 Rhythmus anschlagen. Perfekt für viele Popsongs."
};


/* QUOTE */

const quote = {
text:"Der Weg entsteht beim Gehen.",
author:"Franz Kafka"
};
   
/* -----------------------------
   RESPONSE
----------------------------- */

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
});

};
