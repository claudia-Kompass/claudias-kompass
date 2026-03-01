export default async function handler(req, res) {
  try {
    const version = "19.1.0";
    const timestamp = new Date().toLocaleString("de-DE");

    // ---------- KRYPTO ----------
    let crypto = {
      bitcoin: { usd: 0, eur: 0, change: 0 },
      nexo: { usd: 0, eur: 0, change: 0 }
    };

    try {
      const cryptoRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true"
      );
      const data = await cryptoRes.json();

      crypto = {
        bitcoin: {
          usd: data.bitcoin?.usd || 0,
          eur: data.bitcoin?.eur || 0,
          change: data.bitcoin?.usd_24h_change || 0
        },
        nexo: {
          usd: data.nexo?.usd || 0,
          eur: data.nexo?.eur || 0,
          change: data.nexo?.usd_24h_change || 0
        }
      };
    } catch (e) {}

    // ---------- WETTER ----------
    let weather = {
      temp: 0,
      code: 0,
      trend: {
        morning: { temp: 0, code: 0 },
        afternoon: { temp: 0, code: 0 },
        evening: { temp: 0, code: 0 }
      }
    };

    try {
      const weatherRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode"
      );
      const weatherData = await weatherRes.json();

      const hourly = weatherData.hourly;

      function getIndex(hour) {
        return hourly.time.findIndex(t =>
          t.includes(`T${hour.toString().padStart(2, "0")}:00`)
        );
      }

      const mI = getIndex(9);
      const aI = getIndex(15);
      const eI = getIndex(21);

      weather = {
        temp: weatherData.current_weather.temperature,
        code: weatherData.current_weather.weathercode,
        trend: {
          morning: {
            temp: hourly.temperature_2m[mI],
            code: hourly.weathercode[mI]
          },
          afternoon: {
            temp: hourly.temperature_2m[aI],
            code: hourly.weathercode[aI]
          },
          evening: {
            temp: hourly.temperature_2m[eI],
            code: hourly.weathercode[eI]
          }
        }
      };
    } catch (e) {}

    // ---------- NEWS (erstmal ohne API) ----------
    const news = [
      {
        title: "Bundestag diskutiert Haushaltsreform",
        source: "Tagesschau",
        url: "https://www.tagesschau.de"
      },
      {
        title: "EU berät über neue Sicherheitsstrategie",
        source: "n-tv",
        url: "https://www.n-tv.de"
      }
    ];

    const response = {
      version,
      timestamp,
      markets: {
        dax: { value: "18.742", date: "Stand aktuell" },
        eurusd: { value: "1.08", date: "Stand aktuell" }
      },
      crypto,
      weather,
      news
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: "API Fehler" });
  }
}
