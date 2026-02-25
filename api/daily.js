// ===============================
// CLAUDIAS KOMPASS – DAILY API
// Version 11.0.0 – Stable Core
// ===============================

async function getCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=eur&include_24hr_change=true"
    );

    const data = await res.json();

    return {
      bitcoin: {
        price: data.bitcoin.eur,
        change: data.bitcoin.eur_24h_change
      },
      nexo: {
        price: data.nexo.eur,
        change: data.nexo.eur_24h_change
      }
    };

  } catch (err) {
    console.error("Crypto API error:", err);
    return null;
  }
}

export default async function handler(req, res) {
  const cryptoData = await getCrypto();
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
            wind: `${data.current.wind_kph} km/h`,
humidity: `${data.current.humidity}%`
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

const markets = cryptoData
  ? `
## Märkte – Crypto

Bitcoin – ${Math.round(cryptoData.bitcoin.price)}€ ${cryptoData.bitcoin.change >= 0 ? "●" : "●"} ${cryptoData.bitcoin.change.toFixed(1)}%

NEXO – ${cryptoData.nexo.price.toFixed(3)}€ ${cryptoData.nexo.change >= 0 ? "●" : "●"} ${cryptoData.nexo.change.toFixed(1)}%

_Stand: letzter verfügbarer Marktpreis (Live API)_
`
  : "## Märkte – Crypto\nDaten aktuell nicht verfügbar.";
    
// ================= MARKETS =================

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
  crypto,
  markets
});

  } catch (err) {
    console.error("GLOBAL ERROR:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}
