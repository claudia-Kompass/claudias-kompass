export async function getWeather() {
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("WEATHER_API_KEY not set");
  }

  const res = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Ilshofen&lang=de`
  );

  const data = await res.json();

  return `
## Wetter Ilshofen

${data.current.temp_c}°C
${data.current.condition.text}
Wind: ${data.current.wind_kph} km/h
Luftfeuchte: ${data.current.humidity}%
`;
}
