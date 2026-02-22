export default async function handler(req, res) {
  try {
    // --------------------------------------------------
    // 1. Aktuelles Datum & Uhrzeit (Live-Datenstand)
    // --------------------------------------------------
    const now = new Date();
    const datum = now.toLocaleDateString("de-DE");
    const uhrzeit = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });

    // --------------------------------------------------
    // 2. Live-Kursdaten von CoinGecko abrufen
    // --------------------------------------------------
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
    );

    if (!response.ok) {
      throw new Error("Fehler beim Abrufen der Marktdaten");
    }

    const data = await response.json();

    const btc = data.bitcoin;
    const nexo = data.nexo;

    // --------------------------------------------------
    // 3. Ampellogik
    // --------------------------------------------------
    function ampel(change) {
      if (change > 1) return "🟢";
      if (change < -1) return "🔴";
      return "🟡";
    }

    // --------------------------------------------------
    // 4. Markt-Einordnung (automatisch)
    // --------------------------------------------------
    let marktEinordnung = "";

    if (btc.usd_24h_change < -1 && nexo.usd_24h_change < -1) {
      marktEinordnung = "Risk-Off Phase – defensive Haltung empfohlen.";
    } else if (btc.usd_24h_change > 1) {
      marktEinordnung = "Risk-On Tendenz – positive Marktstimmung.";
    } else {
      marktEinordnung = "Seitwärts-/Konsolidierungsphase – strategische Ruhe bewahren.";
    }

    // --------------------------------------------------
    // 5. Finaler Ausgabe-Text
    // --------------------------------------------------
    const content = `
## Crypto Radar – Live Analyse

_Datenstand: ${datum} · Live-Marktdaten_

---

### Bitcoin (BTC)
Kurs: ${btc.usd.toLocaleString("de-DE")} USD  
24h Veränderung: ${btc.usd_24h_change.toFixed(2)} % ${ampel(btc.usd_24h_change)}

---

### NEXO
Kurs: ${nexo.usd.toLocaleString("de-DE")} USD  
24h Veränderung: ${nexo.usd_24h_change.toFixed(2)} % ${ampel(nexo.usd_24h_change)}

---

### Strategische Einordnung

${marktEinordnung}

Strategische Haltung: Keine impulsiven Entscheidungen. Markt beobachten.
`;

    res.status(200).json({ content });

  } catch (error) {
    res.status(500).json({
      content: "Fehler beim Laden der Crypto-Daten."
    });
  }
}
