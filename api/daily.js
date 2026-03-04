module.exports = async function handler(req, res) {
  try {

    const version = "20.0.0";
    const now = new Date();
    const timestamp = now.toLocaleString("de-DE");
    const marketDate = now.toLocaleDateString("de-DE");

    function normalizeTitle(title){
      return (title||"").toLowerCase().replace(/[^a-z0-9]/gi,"");
    }

    function parseRSS(xml,source="RSS"){
      const items=[];
      const matches=xml.match(/<item>([\s\S]*?)<\/item>/g)||[];

      matches.forEach(i=>{
        const t=i.match(/<title>(.*?)<\/title>/);
        const l=i.match(/<link>(.*?)<\/link>/);
        if(t&&l){
          items.push({
            title:t[1].replace(/<!\[CDATA\[(.*?)\]\]>/,"$1").trim(),
            url:l[1].trim(),
            source
          });
        }
      });
      return items;
    }

    function isCurrent(months){
      const m=new Date().getMonth()+1;
      return months.includes(m);
    }

    /* GLOBAL NEWS */

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
          const t=await r.text();
          collected=collected.concat(parseRSS(t,s.name));
        }catch{}
      }

      news=collected
        .filter((a,i,self)=>i===self.findIndex(b=>normalizeTitle(a.title)===normalizeTitle(b.title)))
        .slice(0,5);

    }catch{}

    /* REGIONAL NEWS */

    let regional=[];

    try{
      const r=await fetch("https://www.tagesschau.de/inland/regional/badenwuerttemberg/index~rss2.xml");
      const xml=await r.text();
      regional=parseRSS(xml,"Tagesschau BW").slice(0,4);
    }catch{}

    /* EVENTS */

    let weeklyMarkets=[
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

    let fairs=[

      {
        title:"CMT – Urlaubsmesse",
        location:"Messe Stuttgart, Messepiazza 1",
        time:"10:00–18:00",
        url:"https://www.messe-stuttgart.de/cmt/",
        months:[1]
      },

      {
        title:"Kreativ Messe Stuttgart",
        location:"Messe Stuttgart",
        time:"10:00–18:00",
        url:"https://www.messe-stuttgart.de/kreativ/",
        months:[11]
      },

      {
        title:"Consumenta",
        location:"Messezentrum Nürnberg",
        time:"10:00–18:00",
        url:"https://www.consumenta.de",
        months:[10,11]
      },

      {
        title:"Genussmesse Heilbronn",
        location:"Redblue Messehalle Heilbronn",
        time:"10:00–18:00",
        url:"https://redblue.de",
        months:[3,4]
      },

      {
        title:"Arena Hohenlohe Verbrauchermesse",
        location:"Arena Hohenlohe Ilshofen",
        time:"10:00–18:00",
        url:"https://arena-hohenlohe.de",
        months:[10]
      }

    ].filter(e=>isCurrent(e.months));

    let regionalEvents=[

      {title:"Haller Frühling",city:"Schwäbisch Hall",months:[4]},
      {title:"Kuchen- und Brunnenfest",city:"Schwäbisch Hall",months:[5,6]},
      {title:"Jakobimarkt",city:"Schwäbisch Hall",months:[7]},
      {title:"Sommernachtsfest",city:"Schwäbisch Hall",months:[8]},
      {title:"Haller Herbst",city:"Schwäbisch Hall",months:[10]},
      {title:"Fränkisches Volksfest",city:"Crailsheim",months:[9]},

      {
        title:"Brombachsee Veranstaltungen",
        city:"Brombachsee",
        url:"https://www.zv-brombachsee.de/veranstaltungen/",
        months:[6,7,8]
      },

      {
        title:"Altmühlsee Festival",
        city:"Altmühlsee",
        url:"https://www.altmuehlsee.de/veranstaltungen",
        months:[7,8]
      }

    ].filter(e=>isCurrent(e.months));

    const events={
      today:[],
      week:[],
      upcoming:[...regionalEvents,...fairs],
      markets:weeklyMarkets
    };

    res.status(200).json({
      version,
      timestamp,
      news,
      regional,
      events
    });

  } catch(err){
    console.error(err);
    res.status(500).json({error:"API Fehler"});
  }
};
