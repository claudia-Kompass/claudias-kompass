export default async function handler(req, res) {
  try {
    const version = "15.0.0";

    // ========================
    // WETTER – Ilshofen
    // ========================
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m";

    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const currentTemp = Math.round(
      weatherData.current_weather.temperature
    );

    function getHour(hour) {
      const index = weatherData.hourly.time.findIndex(t =>
        t.includes(hour)
      );
      return Math.round(weatherData.hourly.temperature_2m[index]);
    }

    // ========================
    // KRYPTO – CoinGecko
    // ========================
    const cryptoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur,usd&include_24hr_change=true";

    const cryptoRes = await fetch(cryptoUrl);
    const cryptoData = await cryptoRes.json();

    // ========================
    // EUR / USD – ohne API Key
    // ========================
    const fxRes = await fetch(
      "https://open.er-api.com/v6/latest/EUR"
    );
    const fxData = await fxRes.json();

    // ========================
    // RESPONSE
    // ========================
    res.status(200).json({
      version,

      weather: {
        location: "Ilshofen",
        temp: currentTemp,
        trend: {
          morning: { temp: getHour("09:00") },
          afternoon: { temp: getHour("15:00") },
          evening: { temp: getHour("21:00") }
        }
      },

      markets: {
        dax: 18500,
        eurusd: fxData.rates.USD
      },

      crypto: {
        bitcoin: {
          eur: cryptoData.bitcoin.eur,
          usd: cryptoData.bitcoin.usd,
          eur_24h_change: cryptoData.bitcoin.eur_24h_change
        },
        nexo: {
          eur: cryptoData.nexo.eur,
          usd: cryptoData.nexo.usd,
          eur_24h_change: cryptoData.nexo.eur_24h_change
        }
      }
    });

  } catch (err) {
    res.status(500).json({ error: "API Fehler" });
  }
}
