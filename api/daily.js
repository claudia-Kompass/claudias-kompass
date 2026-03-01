export default async function handler(req, res) {
  try {
    const version = "19.0.0";
    const now = new Date();

    const timestamp = now.toLocaleString("de-DE");

    // ---------- KRYPTO LIVE ----------
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd,eur&include_24hr_change=true"
    );
    const cryptoData = await cryptoRes.json();

    // ---------- WETTER LIVE ----------
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode"
    );
    const weatherData = await weatherRes.json();

    const currentTemp = weatherData.current_weather.temperature;
    const currentCode = weatherData.current_weather.weathercode;

    // Trendzeiten fest
    const morningIndex = 9;
    const afternoonIndex = 15;
    const eveningIndex = 21;

    const hourly = weatherData.hourly;

    function getIndex(hour) {
      return hourly.time.findIndex(t => t.includes(`T${hour.toString().padStart(2,"0")}:00`));
    }

    const mI = getIndex(9);
    const aI = getIndex(15);
    const eI = getIndex(21);

    const response = {
      version,
      timestamp,

      markets: {
        dax: {
          value: "18.742",
          date: "Stand vom 27.02.2026"
        },
        eurusd: {
          value: "1.08",
          date: "Stand vom 27.02.2026"
        }
      },

      crypto: {
        bitcoin: {
          usd: cryptoData.bitcoin.usd,
          eur: cryptoData.bitcoin.eur,
          change: cryptoData.bitcoin.usd_24h_change
        },
        nexo: {
          usd: cryptoData.nexo.usd,
          eur: cryptoData.nexo.eur,
          change: cryptoData.nexo.usd_24h_change
        }
      },

      weather: {
        temp: currentTemp,
        code: currentCode,
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
      }
    };

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ error: "API Fehler" });
  }
}
