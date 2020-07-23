const apiKey = "bb3735e9ab5dcf958b5bd43205c93bee";

$("#currentDay").text(moment().format("LL"));

$("#search").on("click", function (event) {
    event.preventDefault();
    const city = $("#city-input").val().trim();

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

            $(".city").html("<h1>" + response.name + " Weather Details</h1>");
            $(".wind").text("Wind Speed: " + response.wind.speed);
            $(".humidity").text("Humidity: " + response.main.humidity);

            var tempF = (response.main.temp - 273.15) * 1.80 + 32;

            $(".temp").text("Temperature (K) " + response.main.temp);
            $(".tempF").text("Temperature (F) " + tempF.toFixed(2));

            // console.log("Wind Speed: " + response.wind.speed);
            // console.log("Humidity: " + response.main.humidity);
            // console.log("Temperature (F): " + tempF);
        });
}
