// Open-Meteo API base URL (no API key required here)
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

//deploy

// Weather code descriptions in English and Romanian
const weatherCodeDescriptions = {
  0: { en: 'Clear sky', ro: 'Cer senin' },
  1: { en: 'Mainly clear', ro: 'Preponderent senin' },
  2: { en: 'Partly cloudy', ro: 'Parțial noros' },
  3: { en: 'Overcast', ro: 'Înnorat' },
  45: { en: 'Fog', ro: 'Ceață' },
  48: { en: 'Depositing rime fog', ro: 'Ceață cu depunere de brumă' },
  51: { en: 'Light drizzle', ro: 'Averse ușoare' },
  53: { en: 'Moderate drizzle', ro: 'Averse moderate' },
  55: { en: 'Dense drizzle', ro: 'Averse abundente' },
  56: { en: 'Light freezing drizzle', ro: 'Averse ușoare de ploaie înghețată' },
  57: { en: 'Dense freezing drizzle', ro: 'Averse abundente de ploaie înghețată' },
  61: { en: 'Slight rain', ro: 'Plouă ușor' },
  63: { en: 'Moderate rain', ro: 'Plouă moderat' },
  65: { en: 'Heavy rain', ro: 'Plouă abundent' },
  66: { en: 'Light freezing rain', ro: 'Plouă înghețată ușor' },
  67: { en: 'Heavy freezing rain', ro: 'Plouă înghețată abundent' },
  71: { en: 'Slight snowfall', ro: 'Ninsori ușoare' },
  73: { en: 'Moderate snowfall', ro: 'Ninsori moderate' },
  75: { en: 'Heavy snowfall', ro: 'Ninsori abundente' },
  77: { en: 'Snow grains', ro: 'Grăunțe de zăpadă' },
  80: { en: 'Slight rain showers', ro: 'Averse ușoare de ploaie' },
  81: { en: 'Moderate rain showers', ro: 'Averse moderate de ploaie' },
  82: { en: 'Violent rain showers', ro: 'Averse violente de ploaie' },
  85: { en: 'Slight snow showers', ro: 'Ninsori ușoare' },
  86: { en: 'Heavy snow showers', ro: 'Ninsori abundente' },
  95: { en: 'Slight thunderstorm', ro: 'Furtună ușoară' },
  96: { en: 'Thunderstorm with slight hail', ro: 'Furtună cu grindină ușoară' },
  99: { en: 'Thunderstorm with heavy hail', ro: 'Furtună cu grindină abundentă' },
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat') || '47.156944';  // Iași's latitude
  const lon = url.searchParams.get('lon') || '27.590278';  // Iași's longitude

  const currentWeatherUrl = `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Europe%2FBucharest`;
  const dailyWeatherUrl = `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&daily=precipitation_probability_mean,temperature_2m_max,temperature_2m_min,sunset,sunrise&timezone=Europe%2FBucharest`;

  try {
    // Fetch current weather data
    const currentWeatherResponse = await fetch(currentWeatherUrl);
    // Check if the response is OK
    if (!currentWeatherResponse.ok) {
      const errorText = await currentWeatherResponse.text();
      console.error('Current Weather API Error:', errorText);
      throw new Error('Failed to fetch current weather data');
    }
    const currentWeatherData = await currentWeatherResponse.json();

    // Fetch daily weather forecast data
    const dailyWeatherResponse = await fetch(dailyWeatherUrl);
    // Check if the response is OK
    if (!dailyWeatherResponse.ok) {
      const errorText = await dailyWeatherResponse.text();
      console.error('Daily Weather API Error:', errorText);
      throw new Error('Failed to fetch daily weather data');
    }
    const dailyWeatherData = await dailyWeatherResponse.json();

    const temperature = currentWeatherData.current_weather.temperature;
    const windspeed = currentWeatherData.current_weather.windspeed;
    const weatherCode = currentWeatherData.current_weather.weathercode;
    const precipitationProbabilityToday = dailyWeatherData.daily.precipitation_probability_mean[0] || 0;

    let rainMessage;
    if (precipitationProbabilityToday < 30) {
      rainMessage = 'Nu plouă'; // Less than 30% chance
    } else if (precipitationProbabilityToday < 70) {
      rainMessage = 'Posibil să plouă'; // Between 30% and 70% chance
    } else {
      rainMessage = 'Plouă sigur - ia umbrela'; // 70% chance or higher
    }

    
    const weatherDescription = weatherCodeDescriptions[weatherCode] || { en: 'Unknown weather condition', ro: 'Condiție meteorologică necunoscută' };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vremea acum in Iași cu Open-Meteo API si Cloudflare Workers</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f0f0f0; margin: 0; padding: 20px; }
          .weather { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
          h1 { color: #333; }
          p { font-size: 1.2em; color: #666; }
          .footer { margin-top: 20px; font-size: 0.9em; color: #aaa; }
        </style>
      </head>
      <body>
        <div class="weather">
          <h1>Vremea acum în Iași</h1>
          <p><strong>Temperatura:</strong> ${temperature}°C</p>
          <p><strong>Viteza vânt:</strong> ${windspeed} km/h</p>
          <p><strong>Afara e:</strong> ${weatherDescription.ro}</p>
          <p><strong>Șanse de ploaie azi:</strong> ${rainMessage}</p>
        </div>
        <div class="footer">Coded by Robert G. with Open-Meteo API and Cloudflare Workers - <a href="https://github.com/robertcezar/grcopenmeteoapiandcloudflareworkers" target="_blank">https://github.com/robertcezar/grcopenmeteoapiandcloudflareworkers</a></div>
      </body>
      </html>
    `;

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
      </head>
      <body>
        <h1>Failed to fetch weather data</h1>
        <p>A apărut o eroare la obținerea datelor meteorologice. Vă rugăm să încercați din nou mai târziu.</p>
        <p>Error details: ${error.message}</p>
      </body>
      </html>
    `;
    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}
