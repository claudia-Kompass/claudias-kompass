export default async function handler(req, res) {
  try {
    // =========================
    // WETTER – Open Meteo
    // =========================
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode&timezone=Europe%2FBerlin";

    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    const current = weatherData.current_weather;

    function getHour(hour) {
      const index = weatherData.hourly.time.findIndex(t =>
        t.includes(hour)
      );
      return {
        temp: Math.round(weatherData.hourly.temperature_2m[index]),
        code: weatherData.hourly.weathercode[index]
      };
    }

    const weather = {
      location: "Ilshofen",
      temp: Math.round(current.temperature),
      code: current.weathercode,
      trend: {
        morning: getHour("09:00"),
        afternoon: getHour("15:00"),
        evening: getHour("21:00")
      }
    };

    // =========================
    // KRYPTO – CoinGecko
    // =========================
    const cryptoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur,usd&include_24hr_change=true";

    const cryptoResponse = await fetch(cryptoUrl);
    const cryptoData = await cryptoResponse.json();

    // =========================
    // EUR/USD
    // =========================
    const fxUrl =
      "https://api.exchangerate.host/latest?base=EUR&symbols=USD";
    const fxResponse = await fetch(fxUrl);
    const fxData = await fxResponse.json();

    // =========================
    // DAX (stabiler Wert)
    // =========================
    const dax = {
      value: 18500,
      change: 0
    };

    res.status(200).json({
      version: "14.0.0",
      weather,
      markets: {
        dax,
        eurusd: fxData.rates.USD
      },
      crypto: {
        bitcoin: cryptoData.bitcoin,
        nexo: cryptoData.nexo
      }
    });

  } catch (error) {
    res.status(500).json({ error: "API Fehler" });
  }
}
