const apiKey = "bb3735e9ab5dcf958b5bd43205c93bee";
const searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

$(document).ready(function () {
    $("#currentDay").text(moment().format("LL"));

    let location = searchHistory.length === 0 ? getLocation() : searchHistory[0];
    getData(location, apiKey);
    renderSearchHistory();
});

$("#search").on("click", function (event) {
    event.preventDefault();
    let location = $("#city-input").val().trim();
    search(location);
});

function search(location) {
    searchHistory.unshift(location);
    if (searchHistory.length > 5) {
        searchHistory.pop();
    }
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));

    getData(location, apiKey);
    renderSearchHistory();
}

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
            console.log(response.weather[response.weather.length - 1].icon);
            getUV(response.coord.lon, response.coord.lat, (uv) => renderCurrentWeather(response, uv));
            getForecast(response.coord.lon, response.coord.lat);
        });
}

function renderCurrentWeather(response, uv) {
    $(".card-body").html("")
        .append($("<h3>").text(response.name + " Weather Details (" + moment().format("LL") + ")"))
        .append($("<p>").text("Wind Speed: " + response.wind.speed + "MPH"))
        .append($("<p>").text("Humidity: " + response.main.humidity + "%"))
        .append($("<p>").text("Temperature: " + convertToFarenheight(response.main.temp) + "°F"))
        .append($("<p>").text("UV index: ").append($("<span>").text(uv).addClass(getUVColorCode(uv))))
        .append(createImg(response.weather[response.weather.length - 1].icon));
}

function getUVColorCode(uv) {
    if (uv < 3.0) {
        return "low";
    }
    else if (uv >= 3.0 && uv < 6.0) {
        return "moderate";
    }
    else if (uv >= 5.0 && uv < 8.0) {
        return "high";
    }
    else if (uv >= 8.0 && uv < 11.0) {
        return "very-high";
    }
    else if (uv >= 11.0) {
        return "extremly-high"
    }
}

function convertToFarenheight(temp) {
    return Math.round((temp - 273.15) * 1.80 + 32);
}

function getUV(lon, lat, setUV) {
    let queryURL = "http://api.openweathermap.org/data/2.5/uvi?appid=" + apiKey + "&lat=" + lat + "&lon=" + lon;

    $.ajax({
        url: queryURL,
        method: "GET"
    })
        .then(function (response) {
            setUV(response.value);
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
    let forecast = seaparateToDailyData(stats);
    let icons = new Array();
    for (let i = 0; i < forecast.length; i++) {
        icons.push(getMostFrequentIcon(getFrequency(forecast[i])));
    }

    return icons;
}

function getMostFrequentIcon(map) {
    let maxFrequency = 0;
    let icon = "";
    for (let [key, value] of map) {
        if (value > maxFrequency) {
            maxFrequency = value;
            icon = key;
        }
    }

    return icon;
}

function getFrequency(forecast) {
    let map = new Map();
    for (let i = 0; i < forecast.length; i++) {
        for (let j = 0; j < forecast[i].weather.length; j++) {
            const current = forecast[i].weather[j].icon.replace("n", "d");
            if (!map.has(current)) {
                map.set(current, 0);
            }
            map.set(current, map.get(current) + 1);
        }
    }

    return map;
}

function seaparateToDailyData(stats) {
    let forecast = Array();
    for (let i = 0; i < stats.length; i += 8) {
        let oneDay = new Array();
        for (let j = 0; j < 8; j++) {
            oneDay.push(stats[i + j]);
        }

        forecast.push(oneDay);
    }

    return forecast;
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
        $("#forecastData").append(createCards(convertToFarenheight(forecastTemperature[i]), forecastHumidity[i], forecastDates[i], createImg(forecastIcons[i]), i));
    }
}

function renderSearchHistory() {
    $("#searchHistory").html("");
    for (let i = 0; i < searchHistory.length; i++) {
        $("#searchHistory").append(createListItem(searchHistory[i]));
    }
}

function createListItem(item) {
    return $("<button>")
    .addClass("list-group-item")
    .text(item)
    .on("click", () => search(item));
}

function createImg(forecastIcon) {
    return $("<img>")
        .attr("src", "http://openweathermap.org/img/wn/" + forecastIcon + "@2x.png");
}

function createCards(currentTemp, currentHum, currentDate, currentIcon, index) {
    return $("<div>")
        .attr("id", "card-" + index)
        .addClass("card forecastDay")
        .text(currentDate + "\ temp: " + currentTemp + "°\ humidity: " + currentHum + "%")
        .append(currentIcon);
}

function getForecastDate(stats) {
    let forecast = Array(stats.length / 8).fill("");

    for (let i = 5; i < stats.length; i += 8) {
        forecast[Math.floor(i / 8)] = moment.unix(stats[i].dt).utc().format("LL");
    }

    return forecast;
}
