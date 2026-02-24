export async function getWeather() {
  const key = process.env.WEATHER_API_KEY;
  const city = "Ilshofen";

  const res = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${city}&days=1&lang=de`
  );

  const data = await res.json();
  const today = data.forecast.forecastday[0];

  return {
    location: data.location.name,
    temp: `${data.current.temp_c}°C`,
    condition: data.current.condition.text,
    code: data.current.condition.code,
    wind: `${data.current.wind_kph} km/h`,
    humidity: `${data.current.humidity}%`,
    trend: {
      morning: {
        temp: today.hour[9].temp_c,
        code: today.hour[9].condition.code
      },
      afternoon: {
        temp: today.hour[15].temp_c,
        code: today.hour[15].condition.code
      },
      evening: {
        temp: today.hour[21].temp_c,
        code: today.hour[21].condition.code
      }
    }
  };
}
