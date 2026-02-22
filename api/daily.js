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

    /* ===============================
       1️⃣ EXECUTIVE – Märkte & Politik
    =============================== */

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

### Deutschland

Konjunktur weiter verhalten.
Unternehmen zeigen Investitionszurückhaltung, Arbeitsmarkt jedoch stabil.
`;

    /* ===============================
       2️⃣ REGIONAL – SHA & Umfeld
    =============================== */

    const regional = `
## Regional-Kompass – Schwäbisch Hall & Hohenlohe

### Infrastruktur
Aktuell keine gemeldeten größeren Sperrungen auf den Hauptverkehrsachsen.
Pendlerverkehr im Berufszeitfenster erhöht.

### Veranstaltungen

• Wochenmarkt Schwäbisch Hall – Samstag 08:00–13:00 Uhr, Marktplatz  
• Salsa Social Nürnberg – Samstag 21:00 Uhr  
• Kinostarts im CineMaxX Heilbronn – ab Donnerstag  
• Kulturveranstaltungen in SHA verstärkt im Frühjahr
`;

    /* ===============================
       3️⃣ WETTER – Ilshofen
    =============================== */

    const weather = `
## Wetter – Ilshofen

Heute überwiegend bewölkt.
Temperatur: 6–11 °C
Leichter Wind.
Kein signifikanter Niederschlag erwartet.
`;

    /* ===============================
       4️⃣ PERSONAL
    =============================== */

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

/* ===============================
   TRAVEL SYSTEM – v9.0.0 Claudia
================================ */

const travelOptions = [
  {
    title: "Südtirol – Fokus & Klarheit",
    tags: ["wandern", "natur", "kulinarik"],
    budget: "mittel",
    level: "regeneration",
    text: `
Wanderung auf der Seiser Alm.
Runde um den Kalterer See.
Mediterrane Küche + klare Höhenluft.

Executive-Effekt:
Distanz schafft strategische Klarheit.
`,
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470"
  },
  {
    title: "Kapverden – Semba & Atlantik",
    tags: ["semba", "tanzen", "wasser"],
    budget: "mittel",
    level: "flow",
    text: `
Semba am Strand.
Barfußtraining im Sand.
Atlantikluft + Rhythmus.

Executive-Effekt:
Flow ersetzt Druck.
`,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
  },
  {
    title: " Salsa & Kultur",
    tags: ["salsa", "kultur", "stadt"],
    budget: "mittel",
    level: "kreativ",
    text: `
Salsa Social in Sevilla.
Tapas & Altstadt.
Abendlicher Spaziergang durch historische Gassen.

Executive-Effekt:
Bewegung aktiviert Kreativität.
`,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
  },
  {
    title: "Segeln & Schnorcheln",
    tags: ["segeln", "schnorcheln", "camping"],
    budget: "flexibel",
    level: "freiheitsmodus",
    text: `
Segeln entlang der Adriaküste.
Schnorcheln im klaren Wasser.
Camping direkt am Meer.

Executive-Effekt:
Weite schafft Überblick.
`,
    image: "https://images.unsplash.com/photo-1493558103817-58b2924bce98"
  }
];

/* === Persönliche Parameter === */

const travelProfile = {
  budget: "mittel",        // niedrig | mittel | flexibel
  mood: "kreativ",         // kreativ | flow | regeneration | freiheitsmodus
  hobbyFocus: "tanzen"     // tanzen | wasser | natur | kultur
}

/* === Auswahl-Logik === */

const filteredOptions = travelOptions.filter(option =>
  (option.budget === travelProfile.budget || option.budget === "flexibel") &&
  option.tags.includes(travelProfile.hobbyFocus)
)

const selected =
  filteredOptions.length > 0
    ? filteredOptions[Math.floor(Math.random() * filteredOptions.length)]
    : travelOptions[Math.floor(Math.random() * travelOptions.length)]

const travel = test;

### ${selected.title}

<img src="${selected.image}" 
     style="width:100%; border-radius:12px; margin:15px 0;" />

${selected.text}
`;

    /* ===============================
       RESPONSE
    =============================== */

    res.status(200).json({
  version: "9.0.0",
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
