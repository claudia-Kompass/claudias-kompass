export default async function handler(req, res) {
  try {
    const version = "17.2.0";
    const now = new Date();
    const timestamp = now.toLocaleString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // ================= WEATHER =================
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m";

    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const currentTemp = weatherData.current_weather.temperature;
    const weatherCode = weatherData.current_weather.weathercode;

    function getHourTemp(hour) {
      const index = weatherData.hourly.time.findIndex(t =>
        t.includes(hour)
      );
      return weatherData.hourly.temperature_2m[index];
    }

    const trend = {
      morning: getHourTemp("09:00"),
      afternoon: getHourTemp("15:00"),
      evening: getHourTemp("21:00")
    };

    // ================= CRYPTO =================
    const cryptoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true";

    const cryptoRes = await fetch(cryptoUrl);
    const cryptoData = await cryptoRes.json();

    // ================= FX =================
    const fxRes = await fetch(
      "https://api.exchangerate.host/latest?base=EUR&symbols=USD"
    );
    const fxData = await fxRes.json();
    const eurusd = fxData.rates.USD;

    // ================= MARKETS (STATIC STAND) =================
    const markets = {
      dax: {
        value: "18.742",
        date: "Stand vom 27.02.2026"
      },
      eurusd: {
        value: eurusd.toFixed(2),
        date: "Stand vom 27.02.2026"
      }
    };

    res.status(200).json({
      version,
      timestamp,
      weather: {
        location: "Ilshofen",
        temp: currentTemp,
        code: weatherCode,
        trend
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
      markets
    });
  } catch (err) {
    res.status(500).json({ error: "API Fehler" });
  }
}
