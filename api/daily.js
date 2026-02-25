8// ===============================
// CLAUDIAS KOMPASS – DAILY API
// Version 11.0.0 – Stable Core
// ===============================

export default async function handler(req, res) {
  try {
    const version = "11.0.0";
    const now = new Date();

    const timestamp = now.toLocaleTimeString("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit"
    });

    // ================= WEATHER =================

    let weather = {
      location: "Ilshofen",
      temp: null,
      condition: "Keine Daten",
      wind: null,
      humidity: null
    };

    try {
      const apiKey = process.env.WEATHER_API_KEY;

      if (apiKey) {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Ilshofen`
        );

        if (response.ok) {
          const data = await response.json();

          weather = {
            location: data.location.name,
            temp: data.current.temp_c,
            condition: data.current.condition.text,
            wind: data.current.wind_kph,
            humidity: data.current.humidity
          };
        }
      }
    } catch (weatherError) {
      console.error("Weather error:", weatherError);
    }

    // ================= AMPEL =================

    function ampel(change) {
      if (change > 0.5) return "up";
      if (change < -0.5) return "down";
      return "neutral";
    }

    // ================= CRYPTO =================

    let crypto = {
      btc: {},
      nexo: {}
    };

    try {
      const cryptoRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
      );

      if (cryptoRes.ok) {
        const data = await cryptoRes.json();

        crypto = {
          btc: {
            value: data.bitcoin.eur,
            change: data.bitcoin.eur_24h_change,
            direction: ampel(data.bitcoin.eur_24h_change)
          },
          nexo: {
            value: data.nexo.eur,
            change: data.nexo.eur_24h_change,
            direction: ampel(data.nexo.eur_24h_change)
          }
        };
      }
    } catch (cryptoError) {
      console.error("Crypto error:", cryptoError);
    }

    // ================= RESPONSE =================

    return res.status(200).json({
      version,
      timestamp,
      weather,
      crypto
    });

  } catch (err) {
    console.error("GLOBAL ERROR:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}
