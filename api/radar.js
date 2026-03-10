module.exports = async function handler(req,res){

try{

const base = require("./data/dance")

const sheet = await fetch(
"https://opensheet.elk.sh/1-VRVeLv5nyHe3ul86d6Mqfd7sfcA4S5-gXkV12rLpZw/1"
)

const sheetData = await sheet.json()

const radar = sheetData
.filter(e => e.title)
.map(e => ({
title: e.title,
city: e.city || "",
style: e.style || "",
location: e.location || "",
url: e.url || ""
}))
.slice(0,20)

res.status(200).json({radar})

}catch(err){

console.log("Radar error")

res.status(200).json({radar:[]})

}

}
