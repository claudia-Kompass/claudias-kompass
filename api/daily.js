import { getExecutive } from "../lib/executive.js";
// import { getWeather } from "../lib/weather.js";

export default async function handler(req, res) {
  try {
    const executive = getExecutive();
    const weather = await getWeather();

    res.status(200).json({
      version: "1.1.1",
      executive,
      regional: "Test OK",
      weather,
      personal: "Test OK",
      travel: "Test OK"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Daily-Kompass Fehler"
    });
  }
}
