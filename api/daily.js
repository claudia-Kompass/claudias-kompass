export default async function handler(req, res) {
  try {
    const now = new Date();

    // ---------- LIVE DATEN ----------
    // Bitcoin + Nexo (USD)
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
    );
    const cryptoData = await cryptoRes.json();

    // EUR/USD
    const fxRes = await fetch(
      "https://api.exchangerate.host/latest?base=USD&symbols=EUR"
    );
    const fxData = await fxRes.json();
    const eurUsd = (1 / fxData.rates.EUR).toFixed(2);

    // Wetter Ilshofen (Open-Meteo)
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode&timezone=Europe%2FBerlin"
    );
    const weatherData = await weatherRes.json();

    const current = weatherData.current_weather;

    // Trendzeiten 09 / 15 / 21 Uhr finden
    const hourlyTimes = weatherData.hourly.time;
    const temps = weatherData.hourly.temperature_2m;
    const codes = weatherData.hourly.weathercode;

    function findHour(targetHour) {
      const index = hourlyTimes.findIndex(t =>
        t.includes(`T${targetHour.toString().padStart(2, "0")}:00`)
      );
      return {
        temp: temps[index],
        code: codes[index]
      };
    }

    const morning = findHour(9);
    const afternoon = findHour(15);
    const evening = findHour(21);

    // ---------- RESPONSE ----------
    res.status(200).json({
      version: "18.0.0",
      timestamp: now.toLocaleString("de-DE"),

      weather: {
        location: "Ilshofen",
        temp: current.temperature,
        code: current.weathercode,
        trend: {
          morning,
          afternoon,
          evening
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
          value: eurUsd,
          date: "Live"
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API Fehler" });
  }
}
