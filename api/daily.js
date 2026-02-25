// ===============================
// CLAUDIAS KOMPASS – DAILY API
// Version 10.0.0 – Stable Core
// ===============================

export default async function handler(req, res) {

  try {

    const version = "10.0.0";
    const now = new Date();

    const timestamp = now.toLocaleTimeString("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit"
    });

    // ===== WEATHER =====
    let weather = {
      location: "Ilshofen",
      temp: "-",
      condition: "Keine Daten",
      wind: "-",
      humidity: "-",
      code: 1000,
      trend: {}
    };

    try {
      const apiKey = process.env.WEATHER_API_KEY;

      if (apiKey) {
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=Ilshofen&days=1&aqi=no&alerts=no`
        );

        if (response.ok) {
          const data = await response.json();

          weather = {
            location: data.location?.name || "Ilshofen",
            temp: data.current?.temp_c,
            condition: data.current?.condition?.text || "",
            wind: data.current?.wind_kph + " km/h",
            humidity: data.current?.humidity + "%",
            code: data.current?.condition?.code,
            trend: {}
          };
        }
      }
    } catch (err) {
      console.error("Weather API Error:", err);
    }

    // ===== FINANCE (DUMMY) =====
    const finance = {
      dax: { value: 17850, change: +0.4 },
      sp500: { value: 5120, change: -0.2 },
      eurusd: { value: 1.08, change: +0.1 }
    };

    // ===== CRYPTO (DUMMY) =====
    const crypto = {
      btc: { value: 64200, change: +1.2 },
      eth: { value: 3480, change: -0.6 }
    };

    return res.status(200).json({
      version,
      timestamp,
      weather,
      finance,
      // ===============================
// CRYPTO MODULE – v10.2.0
// ===============================

const cryptoRes = await fetch(
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
);

const cryptoData = await cryptoRes.json();

function ampelfarbe(change) {
  if (change > 0.5) return "up";
  if (change < -0.5) return "down";
  return "neutral";
}

const bitcoin = {
  price: cryptoData.bitcoin.eur,
  change: cryptoData.bitcoin.eur_24h_change,
  direction: ampelfarbe(cryptoData.bitcoin.eur_24h_change)
};

const nexo = {
  price: cryptoData.nexo.eur,
  change: cryptoData.nexo.eur_24h_change,
  direction: ampelfarbe(cryptoData.nexo.eur_24h_change)
};

const marketTimestamp = new Date().toLocaleTimeString("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit"
});
    return res.status(200).json({
  version,
  timestamp,
  weather,
  finance,
  crypto: {
    btc: {
      value: bitcoin.price,
      change: bitcoin.change,
      direction: bitcoin.direction
    },
    nexo: {
      value: nexo.price,
      change: nexo.change,
      direction: nexo.direction
    }
  },
  marketTime: marketTimestamp,
  executive,
  regional,
  personal,
  travel
});
    try {
   ...
   bitcoin bauen
   nexo bauen
   marketTimestamp bauen

   return res.status(200).json({...});
}
catch (err) {
   return fallback
}

    console.error("GLOBAL API ERROR:", err);

    return res.status(200).json({
      version: "10.0.0-fallback",
      timestamp: "",
      weather: {},
      finance: {},
      crypto: {}
    });
  }
}
