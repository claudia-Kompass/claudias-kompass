export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
Erstelle eine strukturierte Tagesausgabe für "Claudias Kompass".

Inhalte:
- Inspirierender Gedanke
- Fokus des Tages
- Business-Impuls
- Persönliche Reflexionsfrage
- Mini-Challenge

Ton: Klar, hochwertig, ruhig, inspirierend.
Sprache: Deutsch.
        `,
      }),
    });

    const data = await response.json();

    // WICHTIG: Neue Responses API korrekt auslesen
    const text =
  data.output_text ||
  data.output?.map(o =>
    o.content?.map(c => c.text).join("")
  ).join("") ||
  "Keine Ausgabe erzeugt.";
  
    return res.status(200).json({ content: text });

  } catch (error) {
    return res.status(500).json({
      error: "Serverfehler",
      details: error.message,
    });
  }
}
