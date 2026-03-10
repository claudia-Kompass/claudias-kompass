const fs = require("fs")
const path = require("path")

async function geocode(address){

try{

const url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(address)

const r = await fetch(url,{
headers:{ "User-Agent":"claudia-kompass" }
})

const data = await r.json()

if(data && data.length){

return {
lat: Number(data[0].lat),
lon: Number(data[0].lon)
}

}

}catch(e){}

return {lat:null,lon:null}

}

function detectFestival(title){

const t = title.toLowerCase()

if(
t.includes("festival") ||
t.includes("weekender") ||
t.includes("congress") ||
t.includes("marathon")
){
return "festival"
}

return "weekly"

}

module.exports = async function handler(req,res){

if(req.method !== "POST"){
return res.status(405).end()
}

try{

const e = req.body

if(!e.title){
return res.status(400).json({error:"missing_title"})
}

const type = detectFestival(e.title)

let lat=null
let lon=null

if(e.address){

const geo = await geocode(e.address)

lat = geo.lat
lon = geo.lon

}

const event = {

type,
title:e.title,
city:e.city || "",
weekday:e.weekday ? Number(e.weekday) : null,
month:e.month ? Number(e.month) : null,
style:e.style || "",
location:e.location || "",
address:e.address || "",
lat,
lon,
url:e.url || ""

}

const file = path.join(process.cwd(),"api/data/dance.js")

let db = require("./data/dance")

db.push(event)

fs.writeFileSync(
file,
"module.exports = " + JSON.stringify(db,null,2)
)

res.status(200).json({status:"added",event})

}catch(err){

console.log(err)

res.status(500).json({error:"failed"})

}

}
