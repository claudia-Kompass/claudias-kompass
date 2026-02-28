export default async function handler(req, res) {
  try {
    const version = "13.0.0";

    const now = new Date();
    const dateString = now.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    const timeString = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin"
    });

    // =========================
    // WETTER – Open Meteo
    // =========================
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=49.178&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode";

    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const current = weatherData.current_weather;

    function getHourly(hour) {
      const index = weatherData.hourly.time.findIndex(t =>
        t.includes(hour)
      );

      return {
        temp: weatherData.hourly.temperature_2m[index],
        code: weatherData.hourly.weathercode[index]
      };
    }

    const weather = {
      location: "Ilshofen",
      temp: Math.round(current.temperature),
      code: current.weathercode,
      trend: {
        morning: getHourly("09:00"),
        afternoon: getHourly("15:00"),
        evening: getHourly("21:00")
      }
    };

    // =========================
    // KRYPTO – CoinGecko
    // =========================
    const cryptoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur,usd&include_24hr_change=true";

    const cryptoRes = await fetch(cryptoUrl);
    const cryptoData = await cryptoRes.json();

    const crypto = {
      bitcoin: {
        eur: cryptoData.bitcoin.eur,
        usd: cryptoData.bitcoin.usd,
        change: cryptoData.bitcoin.eur_24h_change
      },
      nexo: {
        eur: cryptoData.nexo.eur,
        usd: cryptoData.nexo.usd,
        change: cryptoData.nexo.eur_24h_change
      }
    };

    // =========================
    // MÄRKTE (Dummy / Platzhalter)
    // =========================
    const markets = {
      dax: { value: 18500, change: 0.4 },
      eurusd: { value: 1.08, change: -0.2 }
    };

    res.status(200).json({
      version,
      dateString,
      timeString,
      weather,
      crypto,
      markets
    });

  } catch (error) {
    res.status(500).json({ error: "internal_error" });
  }
}
