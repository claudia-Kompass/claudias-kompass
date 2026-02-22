export default async function handler(req, res) {

  function getAmpel(change) {
    if (change >= 1.5) return "🟢";
    if (change <= -1.5) return "🔴";
    return "🟡";
  }

  // Beispielwerte (später dynamisch)
  const btcPrice = 67941;
  const btcChange = -0.26;

  const nexoPrice = 1.21;
  const nexoChange = -1.96;

  const btcAmpel = getAmpel(btcChange);
  const nexoAmpel = getAmpel(nexoChange);

  const content = `
## Crypto Radar – 06:00 Uhr

### Bitcoin (BTC)
Kurs: ${btcPrice} USD  
Veränderung: ${btcChange.toFixed(2)} % ${btcAmpel}

---

### NEXO
Kurs: ${nexoPrice} USD  
Veränderung: ${nexoChange.toFixed(2)} % ${nexoAmpel}

---

### Strategische Ableitung
Defensive Haltung beibehalten.  
Keine impulsiven Entscheidungen.
`;

  res.status(200).json({ content });

}
