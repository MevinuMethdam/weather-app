


// API Key
const apiKey = "dc4704bff273db7a02a4fd9370db7acf";

// HTML Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const headerCityName = document.getElementById("headerCityName");
const localTimeElement = document.getElementById("localTime");
const themeBadge = document.getElementById("themeBadge");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature"); // <- මේක animate කරමු
const description = document.getElementById("description");
const feelsLike = document.getElementById("feelsLike"); // <- මේකත් animate කරමු
const windSpeed = document.getElementById("windSpeed");
const windArrow = document.getElementById("wind-arrow");
const windDirectionText = document.getElementById("wind-direction-text");
const aqiDisplay = document.getElementById("aqi");
const aqiIcon = document.getElementById("aqi-icon");
const sunriseElement = document.getElementById("sunrise");
const sunriseIcon = document.getElementById("sunrise-icon");
const sunsetElement = document.getElementById("sunset");
const sunsetIcon = document.getElementById("sunset-icon");
const pressureElement = document.getElementById("pressure");
const pressureIcon = document.getElementById("pressure-icon"); // Pressure icon එක අල්ලගන්නවා
const hourlyItemsContainer = document.getElementById("hourlyItems");
const forecastItemsContainer = document.getElementById("forecastItems");
const currentWeatherPanel = document.querySelector(".current-weather-panel");
const forecastPanel = document.querySelector(".forecast-panel");

// Event Listeners
searchBtn.addEventListener("click", () => {
    const city = cityInput.value;
    if (city) getWeatherAndForecast(city);
    else alert("Please enter a city name");
});
cityInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") searchBtn.click();
});

// API Call Function
async function getWeatherAndForecast(city) {
    
    currentWeatherPanel.classList.remove("visible");
    forecastPanel.classList.remove("visible");
    hourlyItemsContainer.innerHTML = "";
    forecastItemsContainer.innerHTML = "";
    aqiIcon.innerHTML = "";
    sunriseIcon.innerHTML = ""; 
    sunsetIcon.innerHTML = ""; 
    pressureIcon.innerHTML = ""; 
    weatherIcon.style.display = 'none';

    temperature.textContent = "--°C";
    feelsLike.textContent = "Feels like: --°C";


    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    try {
        // Current Weather
        const responseCurrent = await fetch(currentWeatherUrl);
        const dataCurrent = await responseCurrent.json();
        let lat, lon; 

        if (dataCurrent.cod === 200) {
            headerCityName.textContent = dataCurrent.name;
            
            // Call for Number Counting Animation 
            animateCountUp(temperature, dataCurrent.main.temp, '°C');
            animateCountUp(feelsLike, dataCurrent.main.feels_like, '°C', 'Feels like: ');
            
            
            description.textContent = dataCurrent.weather[0].description;
            
            updateHumidityRing(dataCurrent.main.humidity);

            windSpeed.textContent = `${dataCurrent.wind.speed} km/h`;
            const windDeg = dataCurrent.wind.deg;
            windArrow.style.transform = `rotate(${windDeg}deg)`;
            windDirectionText.textContent = getWindDirectionText(windDeg);
            
            sunriseElement.textContent = formatTime(dataCurrent.sys.sunrise);
            sunsetElement.textContent = formatTime(dataCurrent.sys.sunset);
            pressureElement.textContent = `${dataCurrent.main.pressure} hPa`;

            // Bug Fix 
            sunriseIcon.innerHTML = `<img src="${getAnimatedIcon('01d')}" alt="sunrise">`;
            sunsetIcon.innerHTML = `<img src="${getAnimatedIcon('01n')}" alt="sunset">`;
            // Pressure icon
            pressureIcon.innerHTML = `<img src="${getAnimatedIcon('50d')}" alt="pressure">`; 

            const iconCode = dataCurrent.weather[0].icon;
            weatherIcon.src = getAnimatedIcon(iconCode);
            weatherIcon.style.display = "block";
            
            setWeatherTheme(dataCurrent.weather[0].main); 
            updateDayNightTheme(iconCode);
            
            lat = dataCurrent.coord.lat;
            lon = dataCurrent.coord.lon;
        } else {
            alert(dataCurrent.message);
            return; 
        }

        // Air Quality Index (AQI)
        const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const responseAir = await fetch(airPollutionUrl);
        const dataAir = await responseAir.json();
        if (dataAir && dataAir.list && dataAir.list.length > 0) {
            updateAqi(dataAir.list[0].main.aqi); 
        }

        // Forecast (Hourly & Daily)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const responseForecast = await fetch(forecastUrl);
        const dataForecast = await responseForecast.json();

        if (dataForecast.cod === "200") {
            const next8Hours = dataForecast.list.slice(0, 8); 
            next8Hours.forEach((item, index) => {
                hourlyItemsContainer.appendChild(createHourlyElement(item, index));
            });

            const dailyData = {};
            dataForecast.list.forEach(item => {
                const date = item.dt_txt.split(' ')[0];
                if (!dailyData[date]) dailyData[date] = item;
            });
            const dailyForecasts = Object.values(dailyData).slice(0, 5);
            dailyForecasts.forEach((day, index) => {
                forecastItemsContainer.appendChild(createDailyElement(day, index));
            });
        }
        
        currentWeatherPanel.classList.add("visible");
        forecastPanel.classList.add("visible");

    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Could not fetch weather data. Please try again.");
    }
}

// AQI Badge Update Function
function updateAqi(aqiValue) {
    let aqiText = "", aqiClass = "";
    switch (aqiValue) {
        case 1: aqiText = "Good"; aqiClass = "aqi-1"; break;
        case 2: aqiText = "Fair"; aqiClass = "aqi-2"; break;
        case 3: aqiText = "Moderate"; aqiClass = "aqi-3"; break;
        case 4: aqiText = "Poor"; aqiClass = "aqi-4"; break;
        case 5: aqiText = "Very Poor"; aqiClass = "aqi-5"; break;
        default: aqiText = "N/A";
    }
    aqiDisplay.innerHTML = `<span class="aqi-badge ${aqiClass}">${aqiText} (AQI: ${aqiValue})</span>`;
    aqiIcon.innerHTML = `<img src="${getAnimatedIcon('02d')}" alt="aqi" style="width: 60px; height: 60px;">`;
}

function getWindDirectionText(degree) {
    const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degree / 45) % 8;
    return sectors[index];
}

function getAnimatedIcon(iconCode) {
    const iconMap = {
        "01d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/day.svg",
        "01n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/night.svg",
        "02d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy-day-1.svg",
        "02n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy-night-1.svg",
        "03d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy.svg",
        "03n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy.svg",
        "04d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy.svg",
        "04n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/cloudy.svg",
        "09d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-4.svg",
        "09n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-4.svg",
        "10d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-1.svg",
        "10n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/rainy-5.svg",
        "11d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/thunder.svg",
        "11n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/thunder.svg",
        "13d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/snowy-3.svg",
        "13n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/snowy-5.svg",
        "50d": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/mist.svg",
        "50n": "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/mist.svg",
    };
    return iconMap[iconCode] || "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/weather.svg";
}

function createHourlyElement(itemData, index) {
    const date = new Date(itemData.dt * 1000);
    const time = formatTime(itemData.dt);
    const iconCode = itemData.weather[0].icon;
    const temp = `${Math.round(itemData.main.temp)}°C`;
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("hourly-item");
    itemDiv.style.animationDelay = `${index * 0.1}s`;
    itemDiv.innerHTML = `
        <p>${time}</p>
        <img src="${getAnimatedIcon(iconCode)}" alt="Icon" style="width:50px; height:50px;">
        <p class="temp">${temp}</p>
    `;
    return itemDiv;
}
function createDailyElement(dayData, index) {
    const date = new Date(dayData.dt * 1000);
    const dayName = date.toLocaleString("en-US", { weekday: "short" });
    const iconCode = dayData.weather[0].icon;
    const temp = `${Math.round(dayData.main.temp)}°C`;
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("forecast-item");
    itemDiv.style.animationDelay = `${index * 0.1}s`;
    itemDiv.innerHTML = `
        <p>${dayName}</p>
        <img src="${getAnimatedIcon(iconCode)}" alt="Icon" style="width:50px; height:50px;">
        <p class="temp">${temp}</p>
    `;
    return itemDiv;
}

function setWeatherTheme(main) {
  const bg = document.getElementById('dynamicBg');
  if (!bg) return;
  const lower = String(main).toLowerCase();
  
  if (lower.includes('clear')) {
    bg.style.background = "radial-gradient(circle at 20% 20%, rgba(255,200,110,0.08), transparent 8%), radial-gradient(circle at 80% 80%, rgba(80,170,255,0.06), transparent 12%)";
  } else if (lower.includes('cloud')) {
    bg.style.background = "radial-gradient(circle at 10% 20%, rgba(200,210,220,0.04), transparent 8%), radial-gradient(circle at 90% 75%, rgba(160,170,180,0.06), transparent 12%)";
  } else if (lower.includes('rain') || lower.includes('drizzle')) {
    bg.style.background = "radial-gradient(circle at 20% 20%, rgba(90,120,200,0.06), transparent 8%), radial-gradient(circle at 80% 80%, rgba(60,90,140,0.08), transparent 14%)";
  } else if (lower.includes('snow')) {
    bg.style.background = "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 8%), radial-gradient(circle at 80% 80%, rgba(200,230,255,0.06), transparent 12%)";
  } else if (lower.includes('thunder')) {
    bg.style.background = "radial-gradient(circle at 10% 20%, rgba(120,90,220,0.06), transparent 8%), radial-gradient(circle at 90% 80%, rgba(60,80,130,0.08), transparent 14%)";
  } else {
    bg.style.background = "radial-gradient(circle at 10% 10%, rgba(255,215,150,0.06), transparent 8%), radial-gradient(circle at 90% 80%, rgba(80,160,255,0.04), transparent 12%)";
  }
}

function updateHumidityRing(value) {
  const ring = document.getElementById('humRing');
  const text = document.getElementById('humidity');
  const radius = 48;
  const circumference = 2 * Math.PI * radius; // ~302
  const clamped = Math.max(0, Math.min(100, Number(value)));
  const offset = circumference - (clamped / 100) * circumference;
  
  if (ring) {
    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = `${offset}`;
  }
  if (text) text.textContent = `${clamped}%`;
}

function updateLocalTime() {
  const el = document.getElementById('localTime');
  if (!el) return;
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');
  el.textContent = `${hh}:${mm}`;
}
setInterval(updateLocalTime, 1000);
updateLocalTime();

function updateDayNightTheme(iconCode) {
    const themeText = themeBadge.querySelector('.theme-text');
    const themeIcon = themeBadge.querySelector('.theme-icon');
    
    if (iconCode.includes('d')) {
        themeBadge.dataset.theme = 'Day';
        themeText.textContent = 'Day Mode';
        themeIcon.textContent = 'light_mode'; 
    } else {
        themeBadge.dataset.theme = 'Night';
        themeText.textContent = 'Night Mode';
        themeIcon.textContent = 'dark_mode'; 
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000); 
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
    });
}

// Number Counting
function animateCountUp(element, target, suffix = "°C", prefix = "") {
    let start = 0;
    let duration = 900;
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        let progress = Math.min((currentTime - startTime) / duration, 1);
        
        let eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        let value = Math.floor(start + (target - start) * eased);
        element.textContent = `${prefix}${value}${suffix}`;

        if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

window.addEventListener("load", () => {
    getWeatherAndForecast("Colombo"); 
});