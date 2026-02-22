export default async function handler(req, res) {
  try {

    const now = new Date();

    const timestamp = now.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    /* ======================================
       1️⃣ EXECUTIVE – Märkte & Politik
    ====================================== */

    const executive = `
## Executive Live Radar

_Datenstand: ${timestamp}_

### Märkte

Bitcoin stabil in Seitwärtsbewegung.  
NEXO mit erhöhter Volatilität.  

Gesamtmarkt weiterhin vorsichtig positioniert (Risk-neutral bis leicht Risk-Off).

### Politik – Global

Geopolitisch bleibt die Lage angespannt.  
Fokus liegt auf Handelsbeziehungen USA–China sowie Nahost-Entwicklungen.

### EU

Diskussionen um Wettbewerbsfähigkeit und Industriepolitik nehmen zu.  
Energiepreise stabilisieren sich auf moderatem Niveau.

### Deutschland

Konjunktur weiter verhalten.  
Unternehmen zeigen Investitionszurückhaltung, Arbeitsmarkt jedoch stabil.
`;


    /* ======================================
       2️⃣ REGIONAL – SHA / Hohenlohe
    ====================================== */

    const regional = `
## Regional-Kompass – Schwäbisch Hall & Hohenlohe

### Infrastruktur

Aktuell keine gemeldeten größeren Sperrungen auf den Hauptverkehrsachsen.  
Pendlerverkehr im Berufszeitfenster erhöht.

### Veranstaltungen

• Wochenmarkt Schwäbisch Hall – Samstag 08:00–13:00 Uhr, Marktplatz  
• Lichterfest (Vorschau) – Terminankündigung folgt  
• Salsa Social Nürnberg – Samstag 21:00 Uhr  

### Kultur & Kino

Neue Filmstarts im CinemaxX Heilbronn ab Donnerstag.  
Kulturveranstaltungen in SHA verstärkt im Frühjahr.
`;


    /* ======================================
       3️⃣ WETTER – Ilshofen (heute)
    ====================================== */

    const weather = `
## Wetter – Ilshofen

Heute überwiegend bewölkt.  
Temperatur: 6–11 °C  
Leichter Wind.  
Kein signifikanter Niederschlag erwartet.
`;


    /* ======================================
       4️⃣ PERSONAL – Leben & Fokus
    ====================================== */

    const personal = `
## Persönlicher Bereich

### 🎵 Ukulele-Fokus

Übe heute die Akkorde C – G – Am – F.  
Wechsle langsam und sauber.  
Konzentriere dich auf gleichmäßigen Rhythmus.

### 🍲 Ninja-Rezept – Schnelle Gemüsepfanne

Zutaten:
- Zucchini
- Paprika
- Champignons
- Olivenöl
- Salz, Pfeffer, Kräuter

Zubereitung:
1. Gemüse klein schneiden.
2. In heißer Pfanne mit Olivenöl anbraten.
3. 8–10 Minuten garen.
4. Abschmecken und servieren.

### 💬 Zitat des Tages

„Disziplin ist die Brücke zwischen Zielen und Erfolg.“

### 😄 Witz des Tages

Warum investieren Kryptos nicht in Geduld?  
Weil sie ständig schwanken.
`;

/* ======================================
   TRAVEL
====================================== */

const travel = `
## ✈ Reise-Kompass

### Südtirol – Fokus durch Perspektivwechsel

Wandern entlang der Seiser Alm.
Runde um den Kalterer See.
Klare Höhenluft + mediterrane Küche.

Executive-Effekt:
Distanz schafft Klarheit.
`;
    /* ======================================
       RESPONSE
    ====================================== */

    res.status(200).json({
  version: "8.7.1",
  executive,
  regional,
  weather,
  personal,
  travel
});

  } catch (error) {

    res.status(500).json({
      error: "Daily-Kompass konnte nicht geladen werden."
    });

  }
}
