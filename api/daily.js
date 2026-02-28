// ==============================
// GLOBAL SOUL API v12.3.0
// ==============================

export default async function handler(req, res) {

  // ====== WEATHER (Open-Meteo) ======
  const weatherRes = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=49.17&longitude=9.92&current_weather=true&hourly=temperature_2m,weathercode&timezone=Europe/Berlin"
  );
  const weatherData = await weatherRes.json();

  const weatherCode = weatherData.current_weather.weathercode;
  const currentTemp = weatherData.current_weather.temperature;

  // Tagestrend (09 / 15 / 21 Uhr)
  const hours = weatherData.hourly.time;
  const temps = weatherData.hourly.temperature_2m;
  const codes = weatherData.hourly.weathercode;

  function findHour(target) {
    const index = hours.findIndex(t => t.includes(target));
    return {
      temp: temps[index],
      code: codes[index]
    };
  }

  const trend = {
    morning: findHour("09:00"),
    afternoon: findHour("15:00"),
    evening: findHour("21:00")
  };

  const weather = {
    location: "Ilshofen",
    temp: Math.round(currentTemp),
    code: weatherCode,
    trend
  };

  // ====== CRYPTO (CoinGecko) ======
  const cryptoRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
  );
  const cryptoData = await cryptoRes.json();

  const btcPrice = cryptoData.bitcoin.eur;
  const btcChange = cryptoData.bitcoin.eur_24h_change;

  const nexoPrice = cryptoData.nexo.eur;
  const nexoChange = cryptoData.nexo.eur_24h_change;

  function cryptoAmpel(change) {
    if (change > 1) return "green";
    if (change < -1) return "red";
    return "yellow";
  }

  const crypto = {
    bitcoin: {
      price: btcPrice,
      change: btcChange,
      ampel: cryptoAmpel(btcChange)
    },
    nexo: {
      price: nexoPrice,
      change: nexoChange,
      ampel: cryptoAmpel(nexoChange)
    }
  };

  // ====== DAX (fixer Referenzwert) ======
  const dax = {
    value: 18250,
    change: 0.4
  };

  // ====== DYNAMISCHE TAGESSTIMMUNG ======
  function buildMood(daxChange, btcChange, weatherCode) {
    const marketsPositive = (daxChange > 0 || btcChange > 0);

    if (marketsPositive && weatherCode === 0) {
      return "Momentum nutzen. Klar entscheiden.";
    }

    if (!marketsPositive) {
      return "Ruhig bleiben. Strategie schlägt Emotion.";
    }

    return "Konzentriert bleiben. Der Tag gehört dir.";
  }

  const mood = buildMood(dax.change, btcChange, weatherCode);

  res.status(200).json({
    weather,
    crypto,
    dax,
    mood,
    version: "12.3.0"
  });
}
