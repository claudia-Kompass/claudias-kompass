export function getExecutive() {
  const now = new Date();
  const timestamp = now.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `
## Executive Live Radar

_Datenstand: ${timestamp}_

### Märkte
Bitcoin stabil in Seitwärtsbewegung.  
NEXO mit erhöhter Volatilität.  

Gesamtmarkt weiterhin vorsichtig positioniert.

### Politik – Global
Geopolitische Lage bleibt angespannt.  
Fokus auf Handelsbeziehungen USA–China.

### EU
Diskussionen um Wettbewerbsfähigkeit nehmen zu.
`;
}
