export default function handler(req, res) {
  res.status(200).json({
    version: "17.2.1",
    timestamp: new Date().toLocaleString("de-DE"),
    markets: {
      dax: { value: "—", date: "keine Daten" },
      eurusd: { value: "—", date: "keine Daten" }
    },
    crypto: {
      bitcoin: { price: 0, change: 0 },
      nexo: { price: 0, change: 0 }
    },
    weather: {
      temp: 0,
      code: 3,
      trend: {
        morning: { temp: 0, code: 3 },
        afternoon: { temp: 0, code: 3 },
        evening: { temp: 0, code: 3 }
      }
    }
  });
}
