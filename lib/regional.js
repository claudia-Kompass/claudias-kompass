export function getRegional() {
  const now = new Date().toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return {
    title: "Regional – Ilshofen & Umgebung",
    stand: now,

    wirtschaft:
      "Leichte Belebung im regionalen Mittelstand. Energiepreise bleiben ein wichtiges Planungsthema für Betriebe.",

    infrastruktur:
      "Straßenbaumaßnahmen im Raum Schwäbisch Hall laufen planmäßig. Pendler sollten mögliche Verzögerungen einplanen.",

    veranstaltungen: [
      "Wochenmarkt Schwäbisch Hall – Mittwoch und Samstag, 07:00–12:30 Uhr",
      "Kulturelle Veranstaltungen in Ilshofen und Umgebung am Wochenende"
    ],

    impuls:
      "Regionale Netzwerke und lokale Angebote zahlen sich langfristig aus."
  };
}

export function renderRegional() {
  const container = document.getElementById("regionalBlock");

  if (!container) {
    console.warn("regionalBlock wurde nicht gefunden.");
    return;
  }

  const regional = getRegional();

  container.innerHTML = `
    <section class="regional-content">

      <h3>Wirtschaft</h3>
      <p>${regional.wirtschaft}</p>

      <h3>Infrastruktur</h3>
      <p>${regional.infrastruktur}</p>

      <h3>Veranstaltungen</h3>
      <ul>
        ${regional.veranstaltungen
          .map(event => `<li>${event}</li>`)
          .join("")}
      </ul>

      <h3>Regionaler Impuls</h3>
      <p>${regional.impuls}</p>

      <div class="regional-stand">
        Stand: ${regional.stand}
      </div>

    </section>
  `;
}

/*
  Macht die Funktion auch für das Hauptscript in index.html
  global verfügbar.
*/
window.getRegional = getRegional;
window.renderRegional = renderRegional;