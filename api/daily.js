module.exports = async function handler(req, res) {
  try {
    const version = "21.0.0";
    const now = new Date();
    const timestamp = now.toLocaleString("de-DE");
    const marketDate = now.toLocaleDateString("de-DE");

    /* =========================
       HELPER
    ========================== */

    function normalizeTitle(title) {
      return (title || "").toLowerCase().replace(/[^a-z0-9]/gi, "");
    }

    function parseRSS(xml, source) {
      const items = [];
      const matches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      matches.forEach(item => {
        const t = item.match(/<title>(.*?)<\/title>/);
        const l = item.match(/<link>(.*?)<\/link>/);

        if (t && l) {
          items.push({
            title: t[1].replace(/<!\[CDATA\[(.*?)\]\]>/, "$1"),
            url: l[1],
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
      if(day!==7) x.setDate(x.getDate()+(7-day));
      x.setHours(23,59,59,999);
      return x;
    }

    function inRange(date,a,b){
      return date>=a && date<=b;
    }

    /* =========================
       WEATHER
    ========================== */

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
      const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&hourly=temperature_2m,weathercode&current_weather=true");
      const d=await r.json();

      weather.temp=d.current_weather?.temperature??0;
      weather.code=d.current_weather?.weathercode??0;

      const hours=d.hourly.time;
      const temps=d.hourly.temperature_2m;
      const codes=d.hourly.weathercode;

      function findHour(t){
        const i=hours.findIndex(h=>h.includes(t));
        if(i>-1){
          return {temp:temps[i],code:codes[i]};
        }
        return {temp:0,code:0};
      }

      weather.trend.morning=findHour("09:00");
      weather.trend.afternoon=findHour("15:00");
      weather.trend.evening=findHour("21:00");

    }catch{}

    /* =========================
       CRYPTO
    ========================== */

    let bitcoin={usd:0,eur:0,usd_24h_change:0};
    let nexo={usd:0,eur:0,usd_24h_change:0};

    try{
      const r=await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true");
      const d=await r.json();
      if(d.bitcoin) bitcoin=d.bitcoin;
      if(d.nexo) nexo=d.nexo;
    }catch{}

    /* =========================
       MARKETS
    ========================== */

    const markets={
      dax:{value:"18.742",date:"Stand: "+marketDate},
      eurusd:{value:"1.08",date:"Stand: "+marketDate}
    };

    /* =========================
       GLOBAL NEWS
    ========================== */

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
      .filter((a,i,self)=>i===self.findIndex(b=>normalizeTitle(a.title)===normalizeTitle(b.title)))
      .slice(0,5);

    }catch{}

    /* =========================
       REGIONAL NEWS
    ========================== */

    let regional=[];

    try{
      const r=await fetch("https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml");
      const xml=await r.text();
      regional=parseRSS(xml,"Tagesschau BW").slice(0,4);
    }catch{}

    /* =========================
       EVENT ENGINE
    ========================== */

    const eventDB=[

      {
        title:"Genussmesse Heilbronn",
        city:"Heilbronn",
        location:"Redblue Messehalle",
        date:"2026-03-07",
        time:"10:00–18:00",
        url:"https://redblue.de/"
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
        url:"https://www.messe-stuttgart.de/cmt/"
      },

      {
        title:"Altmühlsee Veranstaltungen",
        city:"Gunzenhausen",
        location:"Altmühlsee",
        url:"https://www.altmuehlsee.de/"
      },

      {
        title:"Brombachsee Veranstaltungen",
        city:"Ramsberg",
        location:"Brombachsee",
        url:"https://www.fraenkisches-seenland.de/"
      }

    ];

    const todayStart=startOfDay(now);
    const weekEnd=endOfWeek(now);
    const next14=new Date(now);
    next14.setDate(now.getDate()+14);

    let today=[];
    let week=[];
    let upcoming=[];

    eventDB.forEach(e=>{

      if(!e.date){
        upcoming.push(e);
        return;
      }

      const d=startOfDay(new Date(e.date));

      if(inRange(d,todayStart,todayStart)){
        today.push(e);
      }
      else if(inRange(d,todayStart,weekEnd)){
        week.push(e);
      }
      else if(inRange(d,weekEnd,next14)){
        upcoming.push(e);
      }

    });

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
      today,
      week,
      upcoming,
      markets:weeklyMarkets
    };

    /* =========================
       RESPONSE
    ========================== */

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

  } catch(err) {

    console.error("API ERROR",err);

    res.status(500).json({
      error:"API Fehler"
    });

  }
};
