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
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true";

    const cryptoResponse = await fetch(cryptoUrl);
    const cryptoData = await cryptoResponse.json();

    const markets = {
      bitcoin: {
        price: cryptoData.bitcoin.eur,
        change: cryptoData.bitcoin.eur_24h_change
      },
      nexo: {
        price: cryptoData.nexo.eur,
        change: cryptoData.nexo.eur_24h_change
      },
      dax: {
        value: 18500,
        change: 0.5
      },
      eurusd: {
        value: 1.08,
        change: -0.2
      }
    };

    res.status(200).json({
      version: "12.3.0",
      weather,
      markets
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API Error" });
  }
}
