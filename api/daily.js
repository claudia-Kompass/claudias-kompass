// ===============================
// CLAUDIAS KOMPASS – DAILY API
// Version 10.0.0 – Stable Core
// ===============================

export default async function handler(req, res) {

  try {

  const version = "10.0.0";
  const timestamp = new Date().toLocaleTimeString("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit"
  });

  const weather = {
    location: "Ilshofen",
    temp: 20,
    condition: "Sonnig"
  };

  const finance = {
    dax: { value: 17850, change: 0.4 }
  };

  const crypto = {
    btc: { value: 64000, change: 1.2 }
  };

  return res.status(200).json({
    version,
    timestamp,
    weather,
    finance,
    crypto
  });

} catch (err) {
  console.error(err);
  return res.status(500).json({ error: "fail" });
  }
