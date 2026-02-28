
module.exports = async function handler(req, res) {
  try {
    const version = "12.3.0";

    const now = new Date();
    const marketTime = now.toLocaleTimeString("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit"
    });

    // --------------------
    // OPEN METEO
    // --------------------
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=49.178&longitude=9.928&current_weather=true"
    );
    const weatherData = await weatherRes.json();

    const currentTemp = Math.round(
      weatherData.current_weather?.temperature || 0
    );

    const weather = {
      location: "Ilshofen",
      temp: currentTemp,
      condition: "Überwiegend klar"
    };

    const weatherTrend = {
      morning: { time: "09:00", temp: 2, condition: "Klar" },
      afternoon: { time: "15:00", temp: 9, condition: "Sonnig" },
      evening: { time: "21:00", temp: 4, condition: "Klar" }
    };

    // --------------------
    // COINGECKO
    // --------------------
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
    );
    const cryptoData = await cryptoRes.json();

    const crypto = {
      btc: {
        price: Math.round(cryptoData.bitcoin?.eur || 0),
        change: (
          cryptoData.bitcoin?.eur_24h_change || 0
        ).toFixed(1)
      },
      nexo: {
        price: (
          cryptoData.nexo?.eur || 0
        ).toFixed(2),
        change: (
          cryptoData.nexo?.eur_24h_change || 0
        ).toFixed(1)
      }
    };

    // --------------------
    // STATIC MARKETS
    // --------------------
    const markets = {
      dax: {
        level: 18500,
        change: "+0.3"
      },
      eurusd: {
        level: 1.08,
        change: "-0.2"
      }
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
