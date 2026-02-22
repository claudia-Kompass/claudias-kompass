export default async function handler(req, res) {
  try {
    // 1️⃣ CoinGecko Daten abrufen
    const marketResponse = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,nexo&vs_currencies=usd&include_24hr_change=true"
    );

    const marketData = await marketResponse.json();

    const btcPrice = marketData.bitcoin.usd;
    const btcChange = marketData.bitcoin.usd_24h_change;

    const nexoPrice = marketData.nexo.usd;
    const nexoChange = marketData.nexo.usd_24h_change;

    // 2️⃣ Ampel-Funktion
    function getSignal(change) {
      if (change > 2) return "🟢";
      if (change < -2) return "🔴";
      return "🟡";
    }

    const btcSignal = getSignal(btcChange);
    const nexoSignal = getSignal(nexoChange);

    // 3️⃣ OpenAI Call
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
Claudias Kompass – Executive Edition

Stand 06:00 CET (letzte verfügbare Marktdaten):

Bitcoin: $${btcPrice.toFixed(2)} (${btcChange.toFixed(2)} %) ${btcSignal}
NEXO: $${nexoPrice.toFixed(2)} (${nexoChange.toFixed(2)} %) ${nexoSignal}

Erstelle nun:

1. Kurze Markt-Einordnung (Risk-On / Risk-Off)
2. Einordnung speziell zu Bitcoin
3. Einordnung speziell zu NEXO
4. Bedeutung für strategische Ruhe oder Aktivität

Sprache: Deutsch
Klar. Analytisch. Ruhig.
Keine Markdown-Sterne.
Keine Emojis außer den oben gelieferten.
`
      })
    });

    const data = await response.json();

    const content =
      data.output?.[0]?.content?.[0]?.text || "Keine Ausgabe erzeugt.";

    res.status(200).json({ content });

  } catch (error) {
    res.status(500).json({ error: "Fehler beim Abrufen der Marktdaten." });
  }
}
