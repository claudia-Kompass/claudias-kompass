export default async function handler(req, res) {
  try {
    // Live-Daten von CoinGecko
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
    );

    const data = await response.json();

    const btc = data.bitcoin;
    const nexo = data.nexo;

    const now = new Date();

    const timestamp = now.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    function ampel(change) {
      if (change > 1) return "🟢";
      if (change < -1) return "🔴";
      return "🟡";
    }

    const output = `
## Crypto Radar – Live Analyse

_Datenstand: ${timestamp} Uhr (Live)_

### Bitcoin (BTC)
Kurs: ${btc.usd.toLocaleString("de-DE")} USD  
24h Veränderung: ${btc.usd_24h_change.toFixed(2)} % ${ampel(btc.usd_24h_change)}

### NEXO
Kurs: ${nexo.usd.toFixed(3)} USD  
24h Veränderung: ${nexo.usd_24h_change.toFixed(2)} % ${ampel(nexo.usd_24h_change)}

### Strategische Einordnung
Markt beobachten. Keine impulsiven Entscheidungen.
`;

    res.status(200).json({ content: output });

  } catch (error) {
    res.status(500).json({
      content: "Crypto-Daten konnten nicht geladen werden."
    });
  }
}
