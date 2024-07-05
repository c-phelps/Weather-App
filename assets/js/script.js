const btnSubmit = $("#btn-submit");
const btnCitySubmit = $(".btn-city");
const apiKey = "b363657ebc1fdf19e08e3e1308890a40";
const eleTodayParent = $("#today-append");
const eleFiveDayParent = $("#5-day-Append");
const eleAppendSearches = $("#append-searches");

function appendAlert(city) {
  const strWarning = city !== 0 ? `The city '${city}' was not found!` : `Please enter a valid city name.`;
  const eleAlert = $("<div>");
  // set attributes to display our alert
  eleAlert.attr("class", "alert alert-danger");
  eleAlert.attr("id", "tempDanger");
  eleAlert.attr("role", "alert");
  // remove any existing alert
  $("#tempDanger").remove();
  // set the text based on the string passed
  eleAlert.text(strWarning);
  // append the element to the modal
  eleTodayParent.append(eleAlert);
}

function determineLatLon(inCity) {
  // fetch city
  let strCity = inCity || $("#input-city").val();
  const geocodingURL = `http://api.openweathermap.org/geo/1.0/direct?q=${strCity}&limit=1&appid=${apiKey}`;
  // form validation for city name
  if (strCity === "") {
    appendAlert(0);
    return;
  }
  fetch(geocodingURL)
    .then(function (response) {
      if (response.ok) {
        // parse the response to json and in the promised .then handle our callback function
        response.json().then(function (data) {
          // make sure the city returned some data
          if (data.length > 0) {
            // take the first value of data for the city returned commenting out the loop
            // for (let obj of data) {
            let objCoords = {
              // set coords to the lat and lon within 2 decimal places
              Lat: parseFloat(data[0].lat).toFixed(2),
              Lon: parseFloat(data[0].lon).toFixed(2),
            };
            // remove any alert that may be on screen
            $("#tempDanger").remove();
            // pass the coordinates on to determineWeather
            determineToday(objCoords, strCity);
            determineFiveDay(objCoords);
            // }
          }
          // we did not receive any results for the search criteria so pass the value we attempted to send to the appendAlert function
          else {
            appendAlert(strCity);
          }
        });
      }
      // give an alert if the response was anything other than ok
      else {
        // appendAlert(strCity);
        alert(`Error:${response.statusText}`);
      }
    })
    // on not found 404
    .catch(function (error) {
      alert("Unable to connect to openweathermap.org");
    });
}

function determineToday({ Lat, Lon }, cityVal) {
  const openWeatherURL = `http://api.openweathermap.org/data/2.5/weather?lat=${Lat}&lon=${Lon}&units=imperial&cnt=48&appid=${apiKey}`;
  console.log(openWeatherURL);
  fetch(openWeatherURL)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          // pass the data for today to storeCity and calcToday functions
          storeCityCreateButton(data, cityVal);
          calculateToday(data);
        });
      } else {
        alert(`Error:${response.statusText}`);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to openweathermap.org");
    });
}

function storeCityCreateButton({ name }, city) {
  let arrCities = JSON.parse(localStorage.getItem("cityInfo")) || [];
  const inArray = arrCities.findIndex(function (cities) {
    return cities.Search === city;
  });
  if (inArray === -1) {
    const objCity = {
      Display: name,
      Search: city,
    };
    arrCities.push(objCity);
    localStorage.setItem("cityInfo", JSON.stringify(arrCities));
    renderButtons();
  }
}

function renderButtons() {
  let arrCities = JSON.parse(localStorage.getItem("cityInfo")) || [];
  let strEle = "";
  eleAppendSearches.empty();
  for (let cities in arrCities) {
    strEle = `${strEle}<button type="button" id=${arrCities[cities].Search.replace(
      " ",
      "-"
    )} class="btn btn-primary btn-city w-100 mb-2">${arrCities[cities].Display}</button>`;
  }
  eleAppendSearches.append(strEle);
}

// destructure the data and pass to the function to calc averages
function calculateToday({ name, main, wind, weather, dt }) {
  // console.log(data);
  let today = dayjs.unix(dt);
  calculateDisplayAverages(name, main.temp, main.humidity, wind.speed, 1, today, true);
}

function determineFiveDay({ Lat, Lon }) {
  // call function to return lat/longitude
  const openWeatherURL = `http://api.openweathermap.org/data/2.5/forecast?lat=${Lat}&lon=${Lon}&units=imperial&cnt=48&appid=${apiKey}`;
  // api.openweathermap.org/data/2.5/forecast/daily?lat=44.34&lon=10.99&cnt=7&appid={API key}
  console.log(openWeatherURL);
  fetch(openWeatherURL)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          calculateFiveDay(data);
        });
      } else {
        alert(`Error:${response.statusText}`);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to openweathermap.org");
    });
}

function calculateFiveDay({ city, list }) {
  // initialize all values that we will be using below
  let tempSum = 0,
    humSum = 0,
    windSum = 0,
    counts = 0,
    curDate = list[0].dt_txt.split(" ")[0],
    dayCount = 1;
  const strCity = city.name;

  for (let obj of list) {
    let thisDate = obj.dt_txt.split(" ")[0];
    // check to see if the currdate is equal to the date split from the data above
    if (curDate === thisDate) {
      tempSum += obj.main.temp;
      humSum += obj.main.humidity;
      windSum += obj.wind.speed;
      counts++;
    }
    // new day - so take the sums and divide by the counts to get the means and send them to the display function
    else {
      calculateDisplayAverages(strCity, tempSum, humSum, windSum, counts, curDate, false);
      // increment day count and set the temp values to the first value found for the day, reset the counts to 1 and update the date
      dayCount++;
      tempSum = obj.main.temp;
      humSum = obj.main.humidity;
      windSum = obj.wind.speed;
      curDate = thisDate;
      counts = 1;
    }
  }
  if (dayCount <= 5) calculateDisplayAverages(strCity, tempSum, humSum, windSum, counts, curDate, false);
}

function calculateDisplayAverages(strCity, tempSum, humSum, windSum, counts, curDate, bool) {
  const meanTemp = parseFloat(tempSum / counts).toFixed(2);
  const meanHum = parseFloat(humSum / counts).toFixed(0);
  const meanWind = parseFloat(windSum / counts).toFixed(2);
  displayWeather(strCity, meanTemp, meanHum, meanWind, curDate, bool);
}

function clearElements() {
  eleTodayParent.empty();
  eleTodayParent.css("border-style", "none");
  eleFiveDayParent.empty();
}

function displayWeather(city, temp, humidity, wind, date, isToday) {
  let strAppend;
  if (isToday === true) {
    strAppend = `<h2>${city} (${dayjs(date).format("M/D/YYYY")})</h2>`;
    strAppend = `${strAppend}<p>Temp: ${temp} °F</p>`;
    strAppend = `${strAppend}<p>Wind: ${wind} MPH</p>`;
    strAppend = `${strAppend}<p>Humidity: ${humidity}%</p>`;
    eleTodayParent.css("border-style", "solid");
    eleTodayParent.append(strAppend);
    eleFiveDayParent.append(`<h3>5-Day Forecast:</h3>`);
  } else {
    strAppend = `<div class="card text-white bg-info mb-3 col-2">`;
    strAppend = `${strAppend}<div class="card-header head">${dayjs(date).format("M/D/YYYY")}</div>`;
    strAppend = `${strAppend}<div class="card-body">`;
    strAppend = `${strAppend}<p class="p-font">Temp: ${temp} °F</p>`;
    strAppend = `${strAppend}<p class="p-font">Wind: ${wind} MPH</p>`;
    strAppend = `${strAppend}<p class="p-font">Humidity: ${humidity}%</p>`;
    strAppend = `${strAppend}</div></div>`;
    eleFiveDayParent.append(strAppend);
  }
}

// TODO: Create button for each successful search and send the ID to the button as long as the ID for that button does not already exist
// TODO: Store previous searches in local storage and populate buttons with ID based off of the search terms that were used for the city
// TODO: Give buttons a class of btnCitySubmit so they can be targeted by the jquery event listener below

$(document).ready(function () {
  renderButtons();

  btnSubmit.on("click", function (event) {
    event.preventDefault();
    clearElements();
    determineLatLon();
  });

  eleAppendSearches.on("click", function (event) {
    event.preventDefault();
    const strID = $(event.target).attr("id");
    clearElements();
    determineLatLon(strID.replace("-", " "));
  });
});
