export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
    );

    const data = await response.json();

    const btc = data.bitcoin;
    const nexo = data.nexo;

    function ampel(change) {
      if (change > 1) return "🟢";
      if (change < -1) return "🔴";
      return "🟡";
    }

    const now = new Date();
    const timestamp = now.toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
    });

    const content = `
## Crypto Radar – 06:00 Uhr Update

Datenstand: ${timestamp}

---

### Bitcoin (BTC)
Kurs: ${btc.usd.toLocaleString("en-US")} USD  
24h Veränderung: ${btc.usd_24h_change.toFixed(2)} % ${ampel(btc.usd_24h_change)}

---

### NEXO
Kurs: ${nexo.usd.toFixed(2)} USD  
24h Veränderung: ${nexo.usd_24h_change.toFixed(2)} % ${ampel(nexo.usd_24h_change)}

---

### Strategische Einordnung

${btc.usd_24h_change > 0 ? "Bitcoin stabil bis positiv – Markt tendenziell konstruktiv." : "Bitcoin leicht schwächer – vorsichtige Marktphase."}

${nexo.usd_24h_change < -2 ? "NEXO zeigt erhöhte Volatilität – Risiko bewusst managen." : "NEXO im Rahmen normaler Schwankung."}

Strategische Haltung: Keine impulsiven Entscheidungen. Markt beobachten.
`;

    res.status(200).json({ content });
  } catch (error) {
    res.status(500).json({
      content: "Live-Kursdaten konnten nicht geladen werden.",
    });
  }
}
