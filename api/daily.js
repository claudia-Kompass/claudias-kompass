export default async function handler(req, res) {
  try {

    const version = "17.1.0";

    // =========================
    // TIMESTAMP
    // =========================
    const now = new Date();
    const timestamp = now.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }) + ", " +
    now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });

    // =========================
    // WETTER (Ilshofen)
    // =========================
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode";

    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const currentTemp = weatherData.current_weather.temperature;
    const weatherCode = weatherData.current_weather.weathercode;

    function getTrend(hour) {
      const index = weatherData.hourly.time.findIndex(t =>
        t.includes(hour)
      );
      return weatherData.hourly.temperature_2m[index];
    }

    // =========================
    // KRYPTO (CoinGecko)
    // =========================
    const cryptoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true";

    const cryptoRes = await fetch(cryptoUrl);
    const cryptoData = await cryptoRes.json();

    // =========================
    // EUR / USD
    // =========================
    const fxRes = await fetch(
      "https://api.exchangerate.host/latest?base=EUR&symbols=USD"
    );
    const fxData = await fxRes.json();

    // =========================
    // RESPONSE
    // =========================
    res.status(200).json({
      version,
      timestamp,
      weather: {
        location: "Ilshofen",
        temp: currentTemp,
        code: weatherCode,
        trend: {
          morning: getTrend("09:00"),
          afternoon: getTrend("15:00"),
          evening: getTrend("21:00")
        }
      },
      crypto: {
        bitcoin: {
          price: cryptoData.bitcoin.usd,
          change: cryptoData.bitcoin.usd_24h_change
        },
        nexo: {
          price: cryptoData.nexo.usd,
          change: cryptoData.nexo.usd_24h_change
        }
      },
      markets: {
        dax: {
          value: "18.742",
          date: "Stand vom 27.02.2026"
        },
        eurusd: {
          value: fxData.rates.USD.toFixed(2),
          date: "Stand vom 27.02.2026"
        }
      }
    });

  } catch (error) {
    res.status(500).json({ error: "API Fehler" });
  }
}
