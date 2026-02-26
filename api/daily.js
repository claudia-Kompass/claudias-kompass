// =====================================
// CLAUDIAS KOMPASS – DAILY API
// Version 11.1.0 – Stable
// =====================================

async function getCrypto() {
  return {
    bitcoin: { price: 57000, change: 1.5 },
    nexo: { price: 0.73, change: 0.8 }
  };
}
      

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
