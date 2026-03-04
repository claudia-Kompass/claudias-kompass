module.exports = async function handler(req,res){

try{

const version="20.1.0";
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
WETTER
====================== */

let weather={
temp:0,
code:0
};

try{

const r=await fetch(
"https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true"
);

const d=await r.json();

weather.temp=d.current_weather?.temperature??0;
weather.code=d.current_weather?.weathercode??0;

}catch{}

/* ======================
MARKETS
====================== */

const markets={
dax:{
value:"18.742",
date:"Stand: "+marketDate
},
eurusd:{
value:"1.08",
date:"Stand: "+marketDate
}
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
EVENT RADAR
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

const fairs=[

{
title:"Genussmesse Heilbronn",
location:"Redblue Messehalle Heilbronn",
time:"10:00–18:00",
url:"https://redblue.de"
},

{
title:"Consumenta Nürnberg",
location:"Messezentrum Nürnberg",
time:"10:00–18:00",
url:"https://www.consumenta.de"
},

{
title:"CMT Stuttgart",
location:"Messe Stuttgart",
time:"10:00–18:00",
url:"https://www.messe-stuttgart.de/cmt/"
}

];

const regionalEvents=[

{
title:"Haller Frühling",
city:"Schwäbisch Hall"
},

{
title:"Fränkisches Volksfest",
city:"Crailsheim"
},

{
title:"Brombachsee Veranstaltungen",
city:"Brombachsee",
url:"https://www.zv-brombachsee.de/veranstaltungen/"
},

{
title:"Altmühlsee Festival",
city:"Altmühlsee",
url:"https://www.altmuehlsee.de/veranstaltungen"
}

];

const events={
today:[],
week:[],
upcoming:[...regionalEvents,...fairs],
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

crypto:{
bitcoin,
nexo
},

weather

});

}catch(e){

console.error(e);

res.status(500).json({
error:"API Fehler"
});

}

};
