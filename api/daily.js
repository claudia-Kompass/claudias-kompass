export default async function handler(req, res) {
  try {
    // ==========================
    // VERSION
    // ==========================
    const version = "14.2.0";

    // ==========================
    // WETTER – Open Meteo
    // ==========================
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m";

    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const current = weatherData.current_weather;

    function getHour(hour) {
      const index = weatherData.hourly.time.findIndex(t =>
        t.includes(hour)
      );
      if (index === -1) return null;
      return Math.round(weatherData.hourly.temperature_2m[index]);
    }

    // ==========================
    // KRYPTO – CoinGecko
    // ==========================
    const cryptoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur,usd";

    const cryptoRes = await fetch(cryptoUrl);
    const cryptoData = await cryptoRes.json();

    // ==========================
    // EUR / USD
    // ==========================
    const fxUrl =
      "https://api.exchangerate.host/latest?base=EUR&symbols=USD";

    const fxRes = await fetch(fxUrl);
    const fxData = await fxRes.json();

    // ==========================
    // RESPONSE
    // ==========================
    res.status(200).json({
      version,
      weather: {
        location: "Ilshofen",
        temp: Math.round(current.temperature),
        morning: getHour("09:00"),
        afternoon: getHour("15:00"),
        evening: getHour("21:00")
      },
      markets: {
        dax: 18500,
        eurusd: fxData.rates?.USD ?? null
      },
      crypto: {
        bitcoin: {
          eur: cryptoData.bitcoin?.eur ?? null,
          usd: cryptoData.bitcoin?.usd ?? null
        },
        nexo: {
          eur: cryptoData.nexo?.eur ?? null,
          usd: cryptoData.nexo?.usd ?? null
        }
      }
    });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "API Fehler", details: error.message });
  }
}
