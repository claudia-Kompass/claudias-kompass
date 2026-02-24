// ===============================
// CLAUDIAS KOMPASS – DAILY API
// Version 9.0.0 – Stable Core
// ===============================

export default async function handler(req, res) {
  try {
    const version = "9.0.0";

    // ---- Zeit ----
    const now = new Date();

const timestamp = now.toLocaleTimeString("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit"
});

    // ===============================
    // WEATHER
    // ===============================

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
            temp: data.current?.temp_c + "°C",
            condition: data.current?.condition?.text || "",
            wind: data.current?.wind_kph + " km/h",
            humidity: data.current?.humidity + "%",
            code: data.current?.condition?.code,
            trend: {
              morning: {
                temp: data.forecast?.forecastday?.[0]?.hour?.[9]?.temp_c,
                code: data.forecast?.forecastday?.[0]?.hour?.[9]?.condition?.code
              },
              afternoon: {
                temp: data.forecast?.forecastday?.[0]?.hour?.[15]?.temp_c,
                code: data.forecast?.forecastday?.[0]?.hour?.[15]?.condition?.code
              },
              evening: {
                temp: data.forecast?.forecastday?.[0]?.hour?.[21]?.temp_c,
                code: data.forecast?.forecastday?.[0]?.hour?.[21]?.condition?.code
              }
            }
          };
        }
      }
    } catch (err) {
      console.error("Weather API Error:", err);
    }

    // ===============================
    // EXECUTIVE
    // ===============================

    const executive = `
## Executive Überblick

Globale Märkte zeigen aktuell erhöhte Unsicherheit.
Inflation bleibt Kernfaktor, Zinserwartungen stabilisieren sich.
Kapitalflüsse bewegen sich defensiv.

Fokus heute: Liquidität, Energiepreise, geopolitische Signale.
`;

    // ===============================
    // REGIONAL
    // ===============================

    const regional = `
## Region Hohenlohe – Landkreis Schwäbisch Hall

Wirtschaft stabil. Mittelstand weiterhin tragend.
Lokale Veranstaltungen und Märkte laufen regulär.
`;

    // ===============================
    // PERSONAL / LERNBLOCK
    // ===============================

    const personal = `
## Impuls des Tages

Konstanz schlägt Intensität.
`;

    // ===============================
    // TRAVEL
    // ===============================

    const travel = `
## Reiseinspiration

Valencia – Segeln & Salsa.
Salvador da Bahia – Wasser & Rhythmus.
`;

    // ===============================
    // RESPONSE
    // ===============================

    return res.status(200).json({
      version,
      timestamp,
      executive: executive || "",
      regional: regional || "",
      weather: weather || {},
      personal: personal || "",
      travel: travel || ""
    });

  } catch (err) {
    console.error("GLOBAL API ERROR:", err);

    return res.status(200).json({
      version: "8.8.0-fallback",
      timestamp: "",
      executive: "System stabil – Inhalte temporär nicht verfügbar.",
      regional: "",
      weather: {
        location: "Ilshofen",
        temp: "-",
        condition: "Keine Daten",
        wind: "-",
        humidity: "-",
        trend: {}
      },
      personal: "",
      travel: ""
    });
  }
}
