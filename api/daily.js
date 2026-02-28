export default async function handler(req, res) {
  try {
    const version = "13.0.0";
    const now = new Date();

    const formattedDate = now.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Berlin"
    });

    const formattedTime = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin"
    });

    // ---------------- WEATHER (LIVE)
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode";

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

    // ---------------- CRYPTO (LIVE)
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
    );
    const cryptoData = await cryptoRes.json();

    const crypto = {
      bitcoin: {
        price: Math.round(cryptoData.bitcoin.eur),
        change: cryptoData.bitcoin.eur_24h_change
      },
      nexo: {
        price: cryptoData.nexo.eur.toFixed(3),
        change: cryptoData.nexo.eur_24h_change
      }
    };

    // ---------------- MARKETS (statisch Demo – später API möglich)
    const markets = {
      dax: { value: 18500, change: 0.4 },
      eurusd: { value: 1.08, change: -0.2 }
    };

    return res.status(200).json({
      version,
      date: formattedDate,
      time: formattedTime,
      weather,
      crypto,
      markets
    });
  } catch (error) {
    return res.status(500).json({ error: "internal_error" });
  }
}
