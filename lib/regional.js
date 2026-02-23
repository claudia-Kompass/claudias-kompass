export function getRegional() {
  const now = new Date().toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `
## Regional – Ilshofen & Umgebung

_Stand: ${now}_

### Wirtschaft
Leichte Belebung im regionalen Mittelstand.
Energiepreise weiterhin Planungsthema für Betriebe.

### Infrastruktur
Straßenbaumaßnahmen im Raum Schwäbisch Hall laufen planmäßig.
Pendler sollten 10–15 Minuten mehr einplanen.

### Veranstaltungen
Wochenmarkt Schwäbisch Hall – Mittwoch & Samstag 07:00–12:30.
Kulturhalle Ilshofen – nächste Veranstaltung am Wochenende.

### Impuls
Regionale Netzwerke zahlen sich langfristig aus.
`;
}
