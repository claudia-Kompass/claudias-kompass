export default async function handler(req, res) {

  const version = "17.2.0";
  const timestamp = new Date().toLocaleString("de-DE");

  try {

    // Wetter statisch als Test
    const weather = {
      location: "Ilshofen",
      temp: 6.4,
      code: 3,
      trend: {
        morning: 11,
        afternoon: 13,
        evening: 6
      }
    };

    // Krypto statisch als Test
    const crypto = {
      bitcoin: { price: 66948, change: 2.1 },
      nexo: { price: 0.85, change: -0.5 }
    };

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

    return res.status(200).json({
      version,
      timestamp,
      weather,
      crypto,
      markets
    });

  } catch (error) {

    return res.status(200).json({
      version,
      timestamp,
      error: "Hard fallback aktiv"
    });

  }
}
