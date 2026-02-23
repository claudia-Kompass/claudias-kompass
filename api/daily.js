import { getExecutive } from "../lib/executive.js";

export default async function handler(req, res) {
  try {
    const executive = getExecutive();

    res.status(200).json({
      version: "1.0.0",
      executive,
      regional: "Modul folgt",
      weather: "Modul folgt",
      personal: "Modul folgt",
      travel: "Modul folgt"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Daily-Kompass Fehler"
    });
  }
}
