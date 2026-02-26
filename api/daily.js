module.exports = async function handler(req, res) {
  try {
    const version = "12.0.0";

    const now = new Date();
    const marketTime = now.toLocaleTimeString("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit"
    });

    // =========================
    // WETTER – Open Meteo (Ilshofen)
    // =========================
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode"
    );

    const weatherData = await weatherRes.json();

    const weatherCodeMap = {
      0: "Klar",
      1: "Überwiegend klar",
      2: "Teilweise bewölkt",
      3: "Bewölkt",
      45: "Nebel",
      48: "Nebel",
      51: "Leichter Regen",
      61: "Regen",
      71: "Schnee",
      95: "Gewitter"
    };

    const currentCode = weatherData.current_weather.weathercode;

    const weather = {
      location: "Ilshofen",
      temp: Math.round(weatherData.current_weather.temperature),
      condition: weatherCodeMap[currentCode] || "Unbekannt"
    };

    const weatherTrend = {
      morning: {
        time: "09:00",
        temp: Math.round(weatherData.hourly.temperature_2m[9]),
        condition: "Trend"
      },
      afternoon: {
        time: "15:00",
        temp: Math.round(weatherData.hourly.temperature_2m[15]),
        condition: "Trend"
      },
      evening: {
        time: "21:00",
        temp: Math.round(weatherData.hourly.temperature_2m[21]),
        condition: "Trend"
      }
    };

    // =========================
    // CRYPTO – CoinGecko
    // =========================
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
    );

    const cryptoData = await cryptoRes.json();

    const crypto = {
      btc: {
        price: Math.round(cryptoData.bitcoin.eur),
        change: cryptoData.bitcoin.eur_24h_change.toFixed(1) + "%"
      },
      nexo: {
        price: cryptoData.nexo.eur.toFixed(2),
        change: cryptoData.nexo.eur_24h_change.toFixed(1) + "%"
      }
    };

    // =========================
    // MÄRKTE (stabil Demo)
    // =========================
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
