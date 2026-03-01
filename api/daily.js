export default async function handler(req, res) {
  const version = "17.1.0";
  const timestamp = new Date().toLocaleString("de-DE");

  try {

    // ===== WEATHER =====
    let weather = { location: "Ilshofen", temp: 0, code: 0, trend: { morning: 0, afternoon: 0, evening: 0 } };

    try {
      const weatherRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode"
      );
      const weatherData = await weatherRes.json();

      const now = weatherData.current_weather.temperature;
      const code = weatherData.current_weather.weathercode;

      function hourTemp(hour) {
        const index = weatherData.hourly.time.findIndex(t => t.includes(hour));
        return weatherData.hourly.temperature_2m[index];
      }

      weather = {
        location: "Ilshofen",
        temp: now,
        code: code,
        trend: {
          morning: hourTemp("09:00"),
          afternoon: hourTemp("15:00"),
          evening: hourTemp("21:00")
        }
      };

    } catch (e) {
      console.log("Weather fallback");
    }

    // ===== CRYPTO =====
    let crypto = { bitcoin: { price: 0, change: 0 }, nexo: { price: 0, change: 0 } };

    try {
      const cryptoRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
      );
      const cryptoData = await cryptoRes.json();

      crypto = {
        bitcoin: {
          price: cryptoData.bitcoin.usd,
          change: cryptoData.bitcoin.usd_24h_change
        },
        nexo: {
          price: cryptoData.nexo.usd,
          change: cryptoData.nexo.usd_24h_change
        }
      };

    } catch (e) {
      console.log("Crypto fallback");
    }

    // ===== MARKETS (statisch robust) =====
    const markets = {
      dax: {
        value: "18.742",
        date: "Stand vom 27.02.2026"
      },
      eurusd: {
        value: "1.08",
        date: "Stand vom 27.02.2026"
      }
    };

    res.status(200).json({
      version,
      timestamp,
      weather,
      crypto,
      markets
    });

  } catch (err) {
    res.status(200).json({
      version,
