// =====================================
// CLAUDIAS KOMPASS – DAILY API
// Version 11.1.0 – Stable
// =====================================

module.exports = async function handler(req, res) {
  try {
    return res.status(200).json({
      version: "11.1.0",
      marketTime: new Date().toLocaleTimeString("de-DE", {
        timeZone: "Europe/Berlin",
        hour: "2-digit",
        minute: "2-digit"
      }),
      weather: {
        location: "Ilshofen",
        temp: 14,
        condition: "Teilweise bewölkt"
      },
      crypto: {
        btc: { price: 57000, change: "1.2%" },
        nexo: { price: 0.73, change: "0.8%" }
      },
      markets: {
        dax: { level: 18500, change: "+0.3%" },
        eurusd: { level: 1.08, change: "-0.2%" }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_error" });
  }
};
