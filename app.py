from flask import Flask, render_template, request, jsonify
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Get API key from environment variable
API_KEY = os.environ.get('OPENWEATHER_API_KEY')
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

def kelvin_to_celsius(kelvin):
    return round(kelvin - 273.15)

def kelvin_to_fahrenheit(kelvin):
    return round((kelvin - 273.15) * 9/5 + 32)

def get_weather_data(city=None, lat=None, lon=None):
    params = {
        'appid': API_KEY,
        'units': 'metric'
    }
    
    if city:
        params['q'] = city
    elif lat and lon:
        params['lat'] = lat
        params['lon'] = lon
    
    response = requests.get(BASE_URL, params=params)
    
    if response.status_code == 200:
        return response.json()
    return None

def get_forecast_data(city=None, lat=None, lon=None):
    params = {
        'appid': API_KEY,
        'units': 'metric'
    }
    
    if city:
        params['q'] = city
    elif lat and lon:
        params['lat'] = lat
        params['lon'] = lon
    
    response = requests.get(FORECAST_URL, params=params)
    
    if response.status_code == 200:
        return response.json()
    return None

def process_weather_data(data):
    if not data:
        return None
    
    processed = {
        'city': data['name'],
        'country': data['sys']['country'],
        'temp': round(data['main']['temp']),
        'temp_f': round((data['main']['temp'] * 9/5) + 32),
        'feels_like': round(data['main']['feels_like']),
        'description': data['weather'][0]['description'].capitalize(),
        'icon': data['weather'][0]['icon'],
        'humidity': data['main']['humidity'],
        'pressure': data['main']['pressure'],
        'wind_speed': data['wind']['speed'],
        'sunrise': datetime.fromtimestamp(data['sys']['sunrise']).strftime('%H:%M'),
        'sunset': datetime.fromtimestamp(data['sys']['sunset']).strftime('%H:%M'),
        'datetime': datetime.fromtimestamp(data['dt']).strftime('%A, %d %b %Y | %I:%M %p'),
        'timezone': data['timezone'],
        'weather_main': data['weather'][0]['main'].lower()
    }
    return processed

def process_forecast_data(data):
    if not data:
        return None
    
    forecasts = []
    # Get one forecast per day (noon time)
    seen_dates = set()
    
    for item in data['list']:
        date = datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d')
        time = datetime.fromtimestamp(item['dt']).strftime('%H')
        
        # Only take one reading per day (around noon)
        if date not in seen_dates and 11 <= int(time) <= 14:
            seen_dates.add(date)
            forecast = {
                'date': datetime.fromtimestamp(item['dt']).strftime('%a, %d %b'),
                'temp': round(item['main']['temp']),
                'description': item['weather'][0]['description'].capitalize(),
                'icon': item['weather'][0]['icon'],
                'humidity': item['main']['humidity'],
                'wind_speed': item['wind']['speed']
            }
            forecasts.append(forecast)
            
            # Limit to 5 days
            if len(forecasts) >= 5:
                break
                
    return forecasts

@app.route('/')
def index():
    return render_template('index.html', api_key=API_KEY)

@app.route('/weather')
def weather():
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    weather_data = get_weather_data(city, lat, lon)
    forecast_data = get_forecast_data(city, lat, lon)
    
    if weather_data:
        processed_weather = process_weather_data(weather_data)
        processed_forecast = process_forecast_data(forecast_data)
        return jsonify({
            'weather': processed_weather,
            'forecast': processed_forecast,
            'success': True
        })
    
    return jsonify({
        'success': False,
        'message': 'Failed to fetch weather data. Please try again.'
    })

if __name__ == '__main__':
    app.run(debug=True)