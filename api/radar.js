module.exports = async function handler(req,res){

res.status(200).json({

radar:[
{
title:"Kizomba Social Stuttgart",
city:"Stuttgart",
style:"kizomba",
location:"Dance Studio",
address:"Stuttgart Germany",
month:7
},
{
title:"Cuban Salsa Party Nürnberg",
city:"Nürnberg",
style:"cuban salsa",
location:"La Isla",
address:"Nürnberg Germany",
month:7
}
]

})

}
