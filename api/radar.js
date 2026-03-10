module.exports = async function handler(req,res){

try{

const searches = [

"https://www.google.com/search?q=kizomba+event+deutschland",
"https://www.google.com/search?q=cuban+salsa+event+deutschland",
"https://www.google.com/search?q=semba+festival+europe"

]

let radar=[]

for(const url of searches){

const r = await fetch(url,{
headers:{
"User-Agent":"Mozilla/5.0"
}
})

const html = await r.text()

const matches = html.match(/<h3.*?>(.*?)<\/h3>/g) || []

matches.forEach(m=>{

const title = m.replace(/<[^>]+>/g,"").trim()

if(title.length>10){
radar.push({title})
}

})

}

radar = radar.slice(0,10)

res.status(200).json({radar})

}catch(err){

console.log("Radar error",err)

res.status(200).json({radar:[]})

}

}
