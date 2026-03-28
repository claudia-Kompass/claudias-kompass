export default async function handler(req, res){

  try{

    const baseLat = 49.170
    const baseLon = 9.920

    const token = process.env.EVENTBRITE_TOKEN

    const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=Germany&expand=venue`

    let events = []

try{

  const r = await fetch(url,{
    headers:{ Authorization: `Bearer ${token}` }
  })

  const json = await r.json()

  events = (json.events || []).map(e => {

  const date = e.start?.local
    ? e.start.local.split("T")[0]
    : null

  return {
    title: e.name?.text || "Event",
    url: e.url || "",
    city: e.venue?.address?.city || "",
    lat: parseFloat(e.venue?.latitude),
    lon: parseFloat(e.venue?.longitude),

    date, // 🔥 KRITISCH

    maps: e.venue?.address
      ? `https://maps.google.com/?q=${encodeURIComponent(
          e.venue.address.localized_address_display
        )}`
      : "",

    type: "event",
    known: false
  }
})

}catch(e){
  console.log("Eventbrite fail")
}

/* 🔥 FALLBACK */
if(!events.length){

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const fallbackDate = tomorrow.toISOString().split("T")[0]
  
  events = [
  {
    title: "Gaildorfer Pferdemarkt",
    city: "Gaildorf",
    lat: 49.010,
    lon: 9.770,
    date: fallbackDate
  },
  {
    title: "Street Food Festival Stuttgart",
    city: "Stuttgart",
    lat: 48.780,
    lon: 9.180,
    date: fallbackDate
  },
  {
    title: "Frühlingsmarkt Ansbach",
    city: "Ansbach",
    lat: 49.300,
    lon: 10.580,
    date: fallbackDate
  },
  {
    title: "Altmühlsee Frühlingsfest",
    city: "Gunzenhausen",
    lat: 49.100,
    lon: 10.750,
    date: fallbackDate
  }
]

}

    events = events.filter(e => e.lat && e.lon)

    events.forEach(e=>{
      e.distance = calcDistance(baseLat, baseLon, e.lat, e.lon)
    })

    events = events
      .filter(e => e.distance < 200)
      .sort((a,b)=>a.distance - b.distance)
      .slice(0,10)

    res.status(200).json(events)

  }catch(err){
    console.log(err)
    res.status(500).json([])
  }
}

function calcDistance(lat1, lon1, lat2, lon2){

  const R = 6371
  const toRad = v => v * Math.PI / 180

  const dLat = toRad(lat2-lat1)
  const dLon = toRad(lon2-lon1)

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon/2)**2

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
}
