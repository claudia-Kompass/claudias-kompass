module.exports = async function handler(req, res) {
  try {

    const version = "11.2.0";

    const now = new Date();
    const marketTime = now.toLocaleTimeString("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Wetter (Demo-Daten stabil)
    const weather = {
      location: "Ilshofen",
      temp: 14,
      condition: "Teilweise bewölkt"
    };

    const weatherTrend = {
      morning: { time: "09:00", temp: 10, condition: "Klar" },
      afternoon: { time: "15:00", temp: 15, condition: "Wolkig" },
      evening: { time: "21:00", temp: 8, condition: "Leichter Regen" }
    };

    const crypto = {
      btc: { price: 57000, change: "1.2%" },
      nexo: { price: 0.73, change: "0.8%" }
    };

    const markets = {
      dax: { level: 18500, change: "+0.3%" },
      eurusd: { level: 1.08, change: "-0.2%" }
    };

    return res.status(200).json({
      version,
      marketTime,
      weather,
      weatherTrend,
      crypto,
      markets
    });

  } catch (err) {
    return res.status(500).json({ error: "internal_error" });
  }
};
