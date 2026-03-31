export default function handler(req, res){

  res.status(200).json({
    version: "1.0",
    news: [
      {
        title: "Test News funktioniert",
        url: "#",
        source: "System"
      }
    ],
    finance: []
  })

}
