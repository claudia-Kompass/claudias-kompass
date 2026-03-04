module.exports = async function handler(req,res){

try{

const version="20.3.0";
const now=new Date();
const timestamp=now.toLocaleString("de-DE");
const marketDate=now.toLocaleDateString("de-DE");

/* ======================
HELPER
====================== */

function normalizeTitle(t){
return (t||"").toLowerCase().replace(/[^a-z0-9]/gi,"");
}

function parseRSS(xml,source){

const items=[];
const matches=xml.match(/<item>([\s\S]*?)<\/item>/g)||[];

matches.forEach(i=>{

const t=i.match(/<title>(.*?)<\/title>/);
const l=i.match(/<link>(.*?)<\/link>/);

if(t&&l){
items.push({
title:t[1].replace(/<!\[CDATA\[(.*?)\]\]>/,"$1"),
url:l[1],
source
});
}

});

return items;
}

/* ======================
WETTER
====================== */

let weather={
temp:0,
code:0,
trend:{
morning:{temp:0,code:0},
afternoon:{temp:0,code:0},
evening:{temp:0,code:0}
}
};

try{

const r=await fetch(
"https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&hourly=temperature_2m,weathercode&current_weather=true"
);

const d=await r.json();

weather.temp=d.current_weather?.temperature??0;
weather.code=d.current_weather?.weathercode??0;

const hours=d.hourly.time;
const temps=d.hourly.temperature_2m;
const codes=d.hourly.weathercode;

function findHour(target){

const index=hours.findIndex(h=>h.includes(target));

if(index>-1){
return{
temp:temps[index],
code:codes[index]
};
}

return{temp:0,code:0};

}

weather.trend.morning=findHour("09:00");
weather.trend.afternoon=findHour("15:00");
weather.trend.evening=findHour("21:00");

}catch{}

/* ======================
CRYPTO
====================== */

let bitcoin={usd:0,eur:0,usd_24h_change:0};
let nexo={usd:0,eur:0,usd_24h_change:0};

try{

const r=await fetch(
"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true"
);

const d=await r.json();

if(d.bitcoin)bitcoin=d.bitcoin;
if(d.nexo)nexo=d.nexo;

}catch{}

/* ======================
MARKETS
====================== */

const markets={
dax:{value:"18.742",date:"Stand: "+marketDate},
eurusd:{value:"1.08",date:"Stand: "+marketDate}
};

/* ======================
GLOBAL NEWS
====================== */

let news=[];

try{

const sources=[
{url:"https://www.tagesschau.de/xml/rss2/",name:"Tagesschau"},
{url:"https://www.spiegel.de/schlagzeilen/tops/index.rss",name:"Spiegel"}
];

let collected=[];

for(const s of sources){

try{
const r=await fetch(s.url);
const xml=await r.text();
collected=collected.concat(parseRSS(xml,s.name));
}catch{}

}

news=collected
.filter((a,i,self)=>
i===self.findIndex(b=>normalizeTitle(a.title)===normalizeTitle(b.title))
)
.slice(0,5);

}catch{}

/* ======================
REGIONAL NEWS
====================== */

let regional=[];

try{

const r=await fetch(
"https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml"
);

const xml=await r.text();
regional=parseRSS(xml,"Tagesschau BW").slice(0,4);

}catch{}

/* ======================
EVENT LOGIK
====================== */

function getWeekRange(){

const start=new Date();
start.setDate(start.getDate()-start.getDay()+1);

const end=new Date(start);
end.setDate(start.getDate()+13);

return{start,end};

}

const {start,end}=getWeekRange();

/* ======================
MESSEN
====================== */

const fairs=[

{
title:"Freizeit Messe Nürnberg",
location:"Messezentrum Nürnberg",
from:"2026-02-25",
to:"2026-03-01",
time:"09:30–18:00",
url:"https://www.freizeitmesse.de"
},

{
{
title:"Genussmesse Heilbronn",
location:"Redblue Messehalle Heilbronn",
from:"2026-03-07",
to:"2026-03-09",
time:"10:00–18:00",
url:"https://redblue.de/events/"
}

{
title:"CMT Stuttgart",
location:"Messe Stuttgart",
from:"2026-01-17",
to:"2026-01-25",
time:"10:00–18:00",
url:"https://www.messe-stuttgart.de/cmt/"
},

{
title:"Consumenta Nürnberg",
location:"Messezentrum Nürnberg",
from:"2026-10-24",
to:"2026-11-01",
time:"10:00–18:00",
url:"https://www.consumenta.de"
}

];

const upcomingFairs=fairs.filter(e=>{

const d=new Date(e.from);
return d>=start && d<=end;

});

/* ======================
WOCHENMÄRKTE
====================== */

const weeklyMarkets=[

{
title:"Wochenmarkt Schwäbisch Hall",
location:"Marktplatz 74523 Schwäbisch Hall",
day:"Mittwoch & Samstag",
time:"07:00–13:00"
},

{
title:"Wochenmarkt Crailsheim",
location:"Marktplatz 74564 Crailsheim",
day:"Samstag",
time:"07:00–13:00"
}

];

const events={
upcoming:upcomingFairs,
markets:weeklyMarkets
};

/* ======================
RESPONSE
====================== */

res.status(200).json({

version,
timestamp,

news,
regional,

events,

markets,

crypto:{bitcoin,nexo},

weather

});

}catch(e){

console.error(e);

res.status(500).json({error:"API Fehler"});

}

};
