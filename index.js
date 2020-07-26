const apiKey = "bb3735e9ab5dcf958b5bd43205c93bee";

$(document).ready(function () {
    $("#currentDay").text(moment().format("LL"));
    getLocation();
});

$("#search").on("click", function (event) {
    event.preventDefault();
    let city = $("#city-input").val().trim();

    getData(city, apiKey);
});

function getLocation() {
    $.ajax('http://ip-api.com/json')
        .then(
            (response) => getData(response.city, apiKey),
            (data, status) => console.log('Request failed. Returned status of', status),
        );
}

function getData(city, apiKey) {
    let queryURL = "https://api.openweathermap.org/data/2.5/weather?" + "q=" + city + "&appid=" + apiKey;
    $.ajax({
        url: queryURL,
        method: "GET"
    })
        .then(function (response) {
            $("#currentCity").html(response.name + " Weather Details");
            $(".wind").text("Wind Speed: " + response.wind.speed + "MPH");
            $(".humidity").text("Humidity: " + response.main.humidity);

            var tempF = (response.main.temp - 273.15) * 1.80 + 32;
            $(".tempF").text("Temperature (F) " + tempF.toFixed(2));

            getUV(response.coord.lon, response.coord.lat);
            getForecast(response.coord.lon, response.coord.lat);
        });
}

function getUV(lon, lat) {
    let queryURL = "http://api.openweathermap.org/data/2.5/uvi?appid=" + apiKey + "&lat=" + lat + "&lon=" + lon;

    $.ajax({
        url: queryURL,
        method: "GET"
    })
        .then(function (response) {
            $(".UV").text("UV: " + response.value);
        });
}

function getForecast(lon, lat) {
    let queryURL = "http://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + apiKey;

    $.ajax({
        url: queryURL,
        method: "GET"
    })
        .then(function (response) {
            let forecastDates = getForecastDate(response.list);
            let forecastTemperature = getForecastMaximums(response.list, item => item.main.temp);
            let forecastHumidity = getForecastMaximums(response.list, item => item.main.humidity);
            let forecastIcons = getWeatherIcons(response.list);

            renderForecastCards(forecastTemperature, forecastHumidity, forecastDates, forecastIcons);
        });
}

function getWeatherIcons(stats) {

    let forecast = Array();
    for (let i = 0; i < stats.length; i += 8) {
        let oneDay = new Array();
        for (let j = 0; j < 8; j++) {
            oneDay.push(stats[i + j]);
        }

        forecast.push(oneDay);
    }

    let icons = new Array();
    for (let i = 0; i < forecast.length; i++) {
        let map = new Map();
        for (let j = 0; j < forecast[i].length; j++) {
            const current = forecast[i][j].weather[0].main;
            if (!map.has(current)) {
                map.set(current, 0);
            }
            map.set(current, map.get(current) + 1);
        }

        let maxFrequency = 0;
        let icon = "";
        for (let [key, value] of map) {
            if (value > maxFrequency) {
                maxFrequency = value;
                icon = key;
            }
        }
        icons.push(icon);
    }

    return icons;
}

function getForecastMaximums(stats, dataPointSupplier) {
    let forecast = Array(stats.length / 8).fill(0);
    for (let i = 0; i < stats.length; i++) {
        const dataPoint = dataPointSupplier(stats[i]);
        forecastIndex = Math.floor(i / 8);
        if (forecast[forecastIndex] < dataPoint) {
            forecast[forecastIndex] = dataPoint;
        }
    }

    return forecast;
}

function renderForecastCards(forecastTemperature, forecastHumidity, forecastDates, forecastIcons) {
    $("#forecastData").html("");
    for (let i = 0; i < forecastTemperature.length; i++) {
        $("#forecastData").append(createCards(forecastTemperature[i], forecastHumidity[i], forecastDates[i], forecastIcons[i], i));
    }
}

function createCards(currentTemp, currentHum, currentDate, currentIcon, index) {
    return $("<div>")
        .attr("id", "card-" + index)
        .addClass("card forecastDay")
        .text(currentDate + " " + currentTemp + " " + currentHum + " " + currentIcon);
}

function getForecastDate(stats) {
    let forecast = Array(stats.length / 8).fill("");

    for (let i = 5; i < stats.length; i += 8) {
        forecast[Math.floor(i / 8)] = moment.unix(stats[i].dt).utc().format("LL");
    }

    return forecast;
}
