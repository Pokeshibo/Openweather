document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const currentLocationBtn = document.getElementById('current-location-btn');
    const loader = document.getElementById('loader');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const weatherContainer = document.getElementById('weather-container');
    const cityName = document.getElementById('city-name');
    const dateTime = document.getElementById('date-time');
    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weather-description');
    const feelsLike = document.getElementById('feels-like');
    const windSpeed = document.getElementById('wind-speed');
    const humidity = document.getElementById('humidity');
    const pressure = document.getElementById('pressure');
    const sunrise = document.getElementById('sunrise');
    const sunset = document.getElementById('sunset');
    const forecastContainer = document.getElementById('forecast-container');
    const celsiusBtn = document.getElementById('celsius');
    const fahrenheitBtn = document.getElementById('fahrenheit');

    // Variables
    let currentWeatherData = null;
    let currentUnit = 'celsius';

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    currentLocationBtn.addEventListener('click', getCurrentLocationWeather);
    celsiusBtn.addEventListener('click', () => switchUnit('celsius'));
    fahrenheitBtn.addEventListener('click', () => switchUnit('fahrenheit'));

    // Functions
    function handleSearch() {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    }

    function getCurrentLocationWeather() {
        if (navigator.geolocation) {
            showLoader();
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    getWeatherByCoords(latitude, longitude);
                },
                error => {
                    hideLoader();
                    showError('Unable to retrieve your location. Please allow location access or search for a city.');
                }
            );
        } else {
            showError('Geolocation is not supported by your browser.');
        }
    }

    function getWeatherByCity(city) {
        showLoader();
        fetch(`/weather?city=${encodeURIComponent(city)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateWeatherUI(data);
                } else {
                    showError(data.message || 'City not found. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                showError('Failed to fetch weather data. Please try again.');
            })
            .finally(() => {
                hideLoader();
            });
    }

    function getWeatherByCoords(lat, lon) {
        showLoader();
        fetch(`/weather?lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateWeatherUI(data);
                } else {
                    showError(data.message || 'Failed to get weather for your location. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                showError('Failed to fetch weather data. Please try again.');
            })
            .finally(() => {
                hideLoader();
            });
    }

    function updateWeatherUI(data) {
        currentWeatherData = data.weather;
        
        // Update current weather
        cityName.textContent = `${data.weather.city}, ${data.weather.country}`;
        dateTime.textContent = data.weather.datetime;
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`;
        weatherIcon.alt = data.weather.description;
        
        // Set temperature based on current unit
        if (currentUnit === 'celsius') {
            temperature.textContent = `${data.weather.temp}°`;
            feelsLike.textContent = data.weather.feels_like;
        } else {
            temperature.textContent = `${data.weather.temp_f}°`;
            feelsLike.textContent = Math.round((data.weather.feels_like * 9/5) + 32);
        }
        
        weatherDescription.textContent = data.weather.description;
        windSpeed.textContent = `${data.weather.wind_speed} m/s`;
        humidity.textContent = `${data.weather.humidity}%`;
        pressure.textContent = `${data.weather.pressure} hPa`;
        sunrise.textContent = data.weather.sunrise;
        sunset.textContent = data.weather.sunset;
        
        // Update forecast
        updateForecastUI(data.forecast);
        
        // Set weather theme
        setWeatherTheme(data.weather.weather_main);
        
        // Show weather container
        hideError();
        weatherContainer.classList.remove('hidden');
    }

    function updateForecastUI(forecastData) {
        forecastContainer.innerHTML = '';
        
        forecastData.forEach(forecast => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            const temp = currentUnit === 'celsius' 
                ? `${forecast.temp}°C` 
                : `${Math.round((forecast.temp * 9/5) + 32)}°F`;
            
            forecastItem.innerHTML = `
                <p class="forecast-date">${forecast.date}</p>
                <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="${forecast.description}">
                <p class="forecast-temp">${temp}</p>
                <p class="forecast-desc">${forecast.description}</p>
                <p><i class="fas fa-tint"></i> ${forecast.humidity}%</p>
                <p><i class="fas fa-wind"></i> ${forecast.wind_speed} m/s</p>
            `;
            
            forecastContainer.appendChild(forecastItem);
        });
    }

    function switchUnit(unit) {
        if (currentUnit === unit) return;
        
        currentUnit = unit;
        
        // Update active class
        if (unit === 'celsius') {
            celsiusBtn.classList.add('active');
            fahrenheitBtn.classList.remove('active');
        } else {
            celsiusBtn.classList.remove('active');
            fahrenheitBtn.classList.add('active');
        }
        
        // Update temperature display if we have weather data
        if (currentWeatherData) {
            if (unit === 'celsius') {
                temperature.textContent = `${currentWeatherData.temp}°`;
                feelsLike.textContent = currentWeatherData.feels_like;
            } else {
                temperature.textContent = `${currentWeatherData.temp_f}°`;
                feelsLike.textContent = Math.round((currentWeatherData.feels_like * 9/5) + 32);
            }
            
            // Update forecast temperatures
            const forecastItems = document.querySelectorAll('.forecast-item');
            const forecastData = document.querySelectorAll('.forecast-temp');
            
            forecastItems.forEach((item, index) => {
                const tempElement = item.querySelector('.forecast-temp');
                const currentTemp = parseInt(tempElement.textContent);
                
                if (unit === 'celsius') {
                    // Convert F to C
                    const celsiusTemp = Math.round((currentTemp - 32) * 5/9);
                    tempElement.textContent = `${celsiusTemp}°C`;
                } else {
                    // Convert C to F
                    const fahrenheitTemp = Math.round((currentTemp * 9/5) + 32);
                    tempElement.textContent = `${fahrenheitTemp}°F`;
                }
            });
        }
    }

    function setWeatherTheme(weatherMain) {
        const currentWeather = document.querySelector('.current-weather');
        
        // Remove all theme classes
        currentWeather.classList.remove(
            'theme-clear', 
            'theme-clouds', 
            'theme-rain', 
            'theme-thunderstorm', 
            'theme-snow', 
            'theme-mist'
        );
        
        // Add appropriate theme class based on weather
        switch(weatherMain) {
            case 'clear':
                currentWeather.classList.add('theme-clear');
                break;
            case 'clouds':
                currentWeather.classList.add('theme-clouds');
                break;
            case 'rain':
            case 'drizzle':
                currentWeather.classList.add('theme-rain');
                break;
            case 'thunderstorm':
                currentWeather.classList.add('theme-thunderstorm');
                break;
            case 'snow':
                currentWeather.classList.add('theme-snow');
                break;
            case 'mist':
            case 'fog':
            case 'haze':
                currentWeather.classList.add('theme-mist');
                break;
            default:
                currentWeather.classList.add('theme-clear');
        }
    }

    function showLoader() {
        loader.style.display = 'flex';
        weatherContainer.classList.add('hidden');
        hideError();
    }

    function hideLoader() {
        loader.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
        weatherContainer.classList.add('hidden');
    }

    function hideError() {
        errorContainer.style.display = 'none';
    }

    // Initialize with current location weather if possible
    getCurrentLocationWeather();
});
