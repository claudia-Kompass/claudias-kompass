import { getExecutive } from "../lib/executive.js";
import { getRegional } from "../lib/regional.js";

export default async function handler(req, res) {
  try {
    const executive = getExecutive();
    const regional = getRegional();

    res.status(200).json({
      version: "1.1.0",
      executive,
      regional,
      weather: "Modul folgt",
      personal: "Modul folgt",
      travel: "Modul folgt"
    });
  }
}
