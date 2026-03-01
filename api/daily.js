export default async function handler(req, res) {
  const version = "18.0.0";
  const timestamp = new Date().toLocaleString("de-DE");

  try {
    // -------------------------
    // CRYPTO – CoinGecko
    // -------------------------
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
    );
    const cryptoData = await cryptoRes.json();

    if (!cryptoData.bitcoin || !cryptoData.nexo) {
      throw new Error("CoinGecko liefert keine Daten");
    }

    // -------------------------
    // WETTER – Open Meteo
    // Ilshofen Koordinaten
    // -------------------------
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode"
    );
    const weatherData = await weatherRes.json();

    if (!weatherData.current_weather) {
      throw new Error("Open-Meteo liefert keine Daten");
    }

    // Trend aus 09 / 15 / 21 Uhr
    const hours = weatherData.hourly.time;
    const temps = weatherData.hourly.temperature_2m;
    const codes = weatherData.hourly.weathercode;

    function findHour(targetHour) {
      const index = hours.findIndex(t => t.includes(`T${targetHour}:00`));
      return index !== -1 ? {
        temp: temps[index],
        code: codes[index]
      } : { temp: 0, code: 3 };
    }

    const morning = findHour("09");
    const afternoon = findHour("15");
    const evening = findHour("21");

    // -------------------------
    // RESPONSE
    // -------------------------
    res.status(200).json({
      status: "live",
      version,
      timestamp,
      markets: {
        dax: { value: "-", date: "externe Quelle optional" },
        eurusd: { value: "-", date: "externe Quelle optional" }
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
      weather: {
        temp: weatherData.current_weather.temperature,
        code: weatherData.current_weather.weathercode,
        trend: {
          morning,
          afternoon,
          evening
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      status: "fallback",
      version,
      timestamp,
      error: error.message
    });
  }
}
