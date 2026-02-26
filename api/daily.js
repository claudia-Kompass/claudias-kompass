// =====================================
// CLAUDIAS KOMPASS – DAILY API
// Version 11.1.0 – Stable
// =====================================

async function getCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      bitcoin: {
        price: Math.round(data.bitcoin.eur),
        change: Number(data.bitcoin.eur_24h_change.toFixed(2))
      },
      nexo: {
        price: Number(data.nexo.eur.toFixed(3)),
        change: Number(data.nexo.eur_24h_change.toFixed(2))
      }
    };
  } catch (err) {
    console.error("Crypto API error:", err);
    return null;
  }
}

function ampel(change) {
  if (change > 0.5) return "up";
  if (change < -0.5) return "down";
  return "neutral";
}

export default async function handler(req, res) {
  try {
    const version = "11.1.0";

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
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=Ilshofen&days=1&aqi=no&alerts=no

        if (response.ok) {
          const data = await response.json();
const hours = data.forecast.forecastday[0].hour;

const findHour = (target) =>
  hours.find(h => h.time.includes(target));

const weatherTrend = {
  morning: findHour("09:00"),
  afternoon: findHour("15:00"),
  evening: findHour("21:00")
};
          weather = {
            location: data.location.name,
            temp: data.current.temp_c,
            condition: data.current.condition.text,
            wind: `${data.current.wind_kph} km/h`,
            humidity: `${data.current.humidity}%`
          };
        }
      }
    } catch (weatherError) {
      console.error("Weather error:", weatherError);
    }

    // ================= CRYPTO =================

    const cryptoData = await getCrypto();

    let crypto = {
      btc: null,
      nexo: null
    };

    if (cryptoData && cryptoData.bitcoin && cryptoData.nexo) {
  crypto = {
    btc: {
      price: cryptoData.bitcoin.price,
      change: `${cryptoData.bitcoin.change}%`,
      direction: ampel(Number(cryptoData.bitcoin.change))
    },
    nexo: {
      price: cryptoData.nexo.price,
      change: `${cryptoData.nexo.change}%`,
      direction: ampel(Number(cryptoData.nexo.change))
    }
  };
}

    // ================= FIXE MÄRKTE =================

    const markets = {
      dax: {
        level: 18500,
        change: "+0.3%",
        direction: "neutral"
      },
      eurusd: {
        level: 1.08,
        change: "-0.2%",
        direction: "neutral"
      }
    };

    // ================= RESPONSE =================

    return res.status(200).json({
  version,
  marketTime: timestamp,
  weather,
  weatherTrend,
  crypto,
  markets
});

  } catch (err) {
    console.error("GLOBAL ERROR:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}
