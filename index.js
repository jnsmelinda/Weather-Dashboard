const apiKey = "bb3735e9ab5dcf958b5bd43205c93bee";

let now = $("#currentDay").text(moment().format("LL"));

function getLocation () {
    $.ajax('http://ip-api.com/json')
    .then(
        (response) => getData(response.city, apiKey),
        (data, status) => console.log('Request failed.  Returned status of', status)
    );
}

getLocation();

$("#search").on("click", function (event) {
    event.preventDefault();
    let city = $("#city-input").val().trim();

    getData(city, apiKey);
});

function getData(city, apiKey) {
    let queryURL = "https://api.openweathermap.org/data/2.5/weather?" + "q=" + city + "&appid=" + apiKey;

    $.ajax({
        url: queryURL,
        method: "GET"
    })
        .then(function (response) {

            console.log(queryURL);

            console.log(response);

            $(".city").html(response.name + " Weather Details");
            $(".date").text("Date: " + moment().format("LL"));
            $(".wind").text("Wind Speed: " + response.wind.speed);
            $(".humidity").text("Humidity: " + response.main.humidity);

            var tempF = (response.main.temp - 273.15) * 1.80 + 32;

            $(".temp").text("Temperature (K) " + response.main.temp);
            $(".tempF").text("Temperature (F) " + tempF.toFixed(2));
        });
}


