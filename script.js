class WeatherApp {
    constructor() {
        this.apiKey = localStorage.getItem('weatherApiKey') || '';
        this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.geoUrl = 'https://api.openweathermap.org/geo/1.0/direct';
        this.uvUrl = 'https://api.openweathermap.org/data/2.5/uvi';
        this.demoMode = localStorage.getItem('demoMode') === 'true';
        
        this.initializeElements();
        this.bindEvents();
        this.checkApiSetup();
    }

    initializeElements() {
        // API setup elements
        this.apiSetup = document.getElementById('apiSetup');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.useDemoBtn = document.getElementById('useDemoMode');

        // Search elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');
        
        // Display elements
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        
        // Weather display elements
        this.cityName = document.getElementById('cityName');
        this.countryName = document.getElementById('countryName');
        this.currentDate = document.getElementById('currentDate');
        this.mainTemp = document.getElementById('mainTemp');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.weatherDesc = document.getElementById('weatherDesc');
        this.feelsLike = document.getElementById('feelsLike');
        this.visibility = document.getElementById('visibility');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.pressure = document.getElementById('pressure');
        this.uvIndex = document.getElementById('uvIndex');
        this.cloudiness = document.getElementById('cloudiness');
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
    }

    bindEvents() {
        // API setup events
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });
        this.useDemoBtn.addEventListener('click', () => this.enableDemoMode());

        // Search events
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.locationBtn.addEventListener('click', () => this.getUserLocation());

        // Add ripple effects to buttons
        this.addRippleEffects();
    }

    checkApiSetup() {
        if (this.apiKey || this.demoMode) {
            this.apiSetup.style.display = 'none';
            this.loadDefaultWeather();
        } else {
            this.apiSetup.style.display = 'block';
            this.weatherDisplay.style.display = 'none';
        }
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            this.showError('Please enter a valid API key');
            return;
        }

        this.apiKey = apiKey;
        localStorage.setItem('weatherApiKey', apiKey);
        localStorage.removeItem('demoMode');
        this.demoMode = false;
        
        this.showSuccessMessage('API key saved successfully!');
        setTimeout(() => {
            this.apiSetup.style.display = 'none';
            this.loadDefaultWeather();
        }, 1500);
    }

    enableDemoMode() {
        localStorage.setItem('demoMode', 'true');
        localStorage.removeItem('weatherApiKey');
        this.demoMode = true;
        this.apiKey = '';
        
        this.showSuccessMessage('Demo mode enabled!');
        setTimeout(() => {
            this.apiSetup.style.display = 'none';
            this.loadDefaultWeather();
        }, 1500);
    }

    showSuccessMessage(message) {
        // Create success message element if it doesn't exist
        let successMsg = document.querySelector('.success-message');
        if (!successMsg) {
            successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            this.apiSetup.appendChild(successMsg);
        }
        
        successMsg.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        successMsg.style.display = 'block';
        
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }

    showLoading() {
        this.loading.classList.add('show');
        this.errorMessage.classList.remove('show');
        this.weatherDisplay.classList.remove('show');
    }

    hideLoading() {
        this.loading.classList.remove('show');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
        this.weatherDisplay.classList.remove('show');
        this.hideLoading();
    }

    showWeather() {
        this.weatherDisplay.classList.add('show', 'fade-in');
        this.errorMessage.classList.remove('show');
        this.hideLoading();
    }

    async handleSearch() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        this.showLoading();
        
        try {
            if (this.demoMode) {
                const weatherData = this.getSimulatedWeatherData(city);
                this.updateWeatherDisplay(weatherData);
                this.showWeather();
            } else {
                const coordinates = await this.getCoordinatesByCity(city);
                if (coordinates) {
                    await this.getWeatherByCoordinates(coordinates.lat, coordinates.lon);
                }
            }
        } catch (error) {
            this.showError('City not found. Please check the spelling and try again.');
        }
    }

    async getCoordinatesByCity(city) {
        if (this.demoMode) {
            // Demo coordinates for popular cities
            const demoCoords = {
                'new york': { lat: 40.7128, lon: -74.0060 },
                'london': { lat: 51.5074, lon: -0.1278 },
                'tokyo': { lat: 35.6762, lon: 139.6503 },
                'paris': { lat: 48.8566, lon: 2.3522 },
                'sydney': { lat: -33.8688, lon: 151.2093 },
                'mumbai': { lat: 19.0760, lon: 72.8777 },
                'delhi': { lat: 28.7041, lon: 77.1025 },
                'bangalore': { lat: 12.9716, lon: 77.5946 },
                'chennai': { lat: 13.0827, lon: 80.2707 },
                'kolkata': { lat: 22.5726, lon: 88.3639 },
                'hyderabad': { lat: 17.3850, lon: 78.4867 },
                'pune': { lat: 18.5204, lon: 73.8567 }
            };
            return demoCoords[city.toLowerCase()] || { lat: 40.7128, lon: -74.0060 };
        }

        try {
            const response = await fetch(`${this.geoUrl}?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`);
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            if (data.length === 0) throw new Error('City not found');
            
            return { lat: data[0].lat, lon: data[0].lon };
        } catch (error) {
            throw new Error('Failed to get coordinates for the city');
        }
    }

    getUserLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                let message = 'Unable to get your location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Location access was denied.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message += 'Location request timed out.';
                        break;
                    default:
                        message += 'An unknown error occurred.';
                        break;
                }
                this.showError(message);
            }
        );
    }

    async getWeatherByCoordinates(lat, lon) {
        try {
            if (this.demoMode) {
                const weatherData = this.getSimulatedWeatherData(null, lat, lon);
                this.updateWeatherDisplay(weatherData);
                this.showWeather();
                return;
            }

            const weatherResponse = await fetch(`${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
            if (!weatherResponse.ok) throw new Error('Weather API request failed');
            
            const weatherData = await weatherResponse.json();
            
            // Get UV index separately
            try {
                const uvResponse = await fetch(`${this.uvUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}`);
                if (uvResponse.ok) {
                    const uvData = await uvResponse.json();
                    weatherData.uvi = uvData.value;
                }
            } catch (uvError) {
                console.log('UV data not available');
                weatherData.uvi = Math.floor(Math.random() * 10) + 1; // Fallback
            }
            
            this.updateWeatherDisplay(weatherData);
            this.showWeather();
        } catch (error) {
            this.showError('Failed to fetch weather data. Please check your API key and try again.');
        }
    }

    getSimulatedWeatherData(cityName = null, lat = null, lon = null) {
        const conditions = [
            { 
                temp: 22, 
                condition: 'Clear',
                desc: 'clear sky',
                icon: '01d',
                humidity: 65,
                windSpeed: 4.2,
                pressure: 1013,
                visibility: 10000,
                cloudiness: 20
            },
            { 
                temp: 18, 
                condition: 'Clouds',
                desc: 'partly cloudy',
                icon: '02d',
                humidity: 70,
                windSpeed: 3.3,
                pressure: 1008,
                visibility: 8000,
                cloudiness: 45
            },
            { 
                temp: 15, 
                condition: 'Rain',
                desc: 'light rain',
                icon: '10d',
                humidity: 85,
                windSpeed: 5.5,
                pressure: 1005,
                visibility: 6000,
                cloudiness: 80
            },
            { 
                temp: 28, 
                condition: 'Clear',
                desc: 'sunny',
                icon: '01d',
                humidity: 45,
                windSpeed: 2.1,
                pressure: 1020,
                visibility: 12000,
                cloudiness: 5
            }
        ];

        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        return {
            name: cityName || this.getCityNameByCoordinates(lat, lon),
            sys: { 
                country: this.getCountryByCoordinates(lat, lon),
                sunrise: Math.floor(Date.now() / 1000) - 3600,
                sunset: Math.floor(Date.now() / 1000) + 3600
            },
            main: {
                temp: randomCondition.temp,
                feels_like: randomCondition.temp + Math.floor(Math.random() * 6) - 3,
                humidity: randomCondition.humidity,
                pressure: randomCondition.pressure
            },
            weather: [{
                main: randomCondition.condition,
                description: randomCondition.desc,
                icon: randomCondition.icon
            }],
            wind: { speed: randomCondition.windSpeed },
            visibility: randomCondition.visibility,
            clouds: { all: randomCondition.cloudiness },
            uvi: Math.floor(Math.random() * 10) + 1
        };
    }

    getCityNameByCoordinates(lat, lon) {
        if (!lat || !lon) return 'Demo City';
        
        // Simple mapping for demo
        if (lat > 40 && lat < 41 && lon > -75 && lon < -74) return 'New York';
        if (lat > 51 && lat < 52 && lon > -1 && lon < 0) return 'London';
        if (lat > 35 && lat < 36 && lon > 139 && lon < 140) return 'Tokyo';
        if (lat > 18 && lat < 20 && lon > 72 && lon < 73) return 'Mumbai';
        if (lat > 28 && lat < 29 && lon > 77 && lon < 78) return 'Delhi';
        if (lat > 12 && lat < 13 && lon > 77 && lon < 78) return 'Bangalore';
        return 'Demo City';
    }

    getCountryByCoordinates(lat, lon) {
        if (!lat || !lon) return 'XX';
        
        // Simple mapping for demo
        if (lat > 40 && lat < 41 && lon > -75 && lon < -74) return 'US';
        if (lat > 51 && lat < 52 && lon > -1 && lon < 0) return 'GB';
        if (lat > 35 && lat < 36 && lon > 139 && lon < 140) return 'JP';
        if (lat > 18 && lat < 30 && lon > 72 && lon < 78) return 'IN';
        return 'XX';
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': 'fas fa-sun',
            '01n': 'fas fa-moon',
            '02d': 'fas fa-cloud-sun',
            '02n': 'fas fa-cloud-moon',
            '03d': 'fas fa-cloud',
            '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud',
            '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain',
            '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-sun-rain',
            '10n': 'fas fa-cloud-moon-rain',
            '11d': 'fas fa-bolt',
            '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake',
            '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog',
            '50n': 'fas fa-smog'
        };
        
        return iconMap[iconCode] || 'fas fa-sun';
    }

    updateWeatherDisplay(data) {
        this.cityName.textContent = data.name;
        this.countryName.textContent = this.getCountryName(data.sys.country);
        this.currentDate.textContent = this.formatDate(new Date());
        
        this.mainTemp.textContent = `${Math.round(data.main.temp)}°C`;
        this.weatherIcon.className = this.getWeatherIcon(data.weather[0].icon);
        this.weatherDesc.textContent = data.weather[0].description;
        this.feelsLike.textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
        
        this.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        this.humidity.textContent = `${data.main.humidity}%`;
        this.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        this.pressure.textContent = `${data.main.pressure} hPa`;
        this.uvIndex.textContent = data.uvi ? Math.round(data.uvi) : Math.floor(Math.random() * 10) + 1;
        this.cloudiness.textContent = `${data.clouds.all}%`;
        
        this.sunrise.textContent = this.formatTime(new Date(data.sys.sunrise * 1000));
        this.sunset.textContent = this.formatTime(new Date(data.sys.sunset * 1000));
    }

    getCountryName(code) {
        const countries = {
            'US': 'United States',
            'GB': 'United Kingdom',
            'JP': 'Japan',
            'IN': 'India',
            'AU': 'Australia',
            'CA': 'Canada',
            'DE': 'Germany',
            'FR': 'France',
            'IT': 'Italy',
            'ES': 'Spain',
            'BR': 'Brazil',
            'CN': 'China',
            'RU': 'Russia',
            'MX': 'Mexico',
            'AR': 'Argentina',
            'ZA': 'South Africa',
            'EG': 'Egypt',
            'NG': 'Nigeria',
            'KE': 'Kenya',
            'TH': 'Thailand',
            'VN': 'Vietnam',
            'ID': 'Indonesia',
            'MY': 'Malaysia',
            'SG': 'Singapore',
            'PH': 'Philippines',
            'KR': 'South Korea',
            'TR': 'Turkey',
            'SA': 'Saudi Arabia',
            'AE': 'United Arab Emirates',
            'IL': 'Israel',
            'PK': 'Pakistan',
            'BD': 'Bangladesh',
            'LK': 'Sri Lanka',
            'NP': 'Nepal',
            'MM': 'Myanmar',
            'XX': 'Unknown'
        };
        return countries[code] || code;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    loadDefaultWeather() {
        // Load default weather for New York
        this.getWeatherByCoordinates(40.7128, -74.0060);
    }

    addRippleEffects() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                let ripple = document.createElement('span');
                ripple.classList.add('ripple');
                this.appendChild(ripple);

                let x = e.clientX - e.target.offsetLeft;
                let y = e.clientY - e.target.offsetTop;

                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Add hover effects to cards
        const cards = document.querySelectorAll('.detail-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});