export default async function handler(req, res) {

  try {

    // ===== TIME =====
    const now = new Date();
    const timestamp = now.toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    // ===== WEATHER (Open-Meteo) =====
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode"
    );
    const weatherData = await weatherRes.json();

    const weather = {
      location: "Ilshofen",
      temp: weatherData.current_weather.temperature,
      code: weatherData.current_weather.weathercode
    };

    // ===== CRYPTO (CoinGecko USD) =====
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
    );
    const cryptoData = await cryptoRes.json();

    const crypto = {
      bitcoin: {
        price: cryptoData.bitcoin.usd,
        change: cryptoData.bitcoin.usd_24h_change
      },
      nexo: {
        price: cryptoData.nexo.usd,
        change: cryptoData.nexo.usd_24h_change
      }
    };

    // ===== MARKETS (FIXED STAND) =====
    const markets = {
      dax: {
        value: "18.742",
        date: "Stand vom 27.02.2026"
      },
      eurusd: {
        value: "1.08",
        date: "Stand vom 27.02.2026"
      }
    };

    res.status(200).json({
      version: "17.0.0",
      timestamp,
      weather,
      crypto,
      markets
    });

  } catch (error) {
    res.status(500).json({ error: "API ERROR" });
  }
}
