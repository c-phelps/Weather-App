const apiKey = "b363657ebc1fdf19e08e3e1308890a40";
const btnSubmit = $("#btn-submit");
const eleTodayParent = $("#today-append");
const eleFiveDayParent = $("#5-day-Append");
const eleAppendSearches = $("#append-searches");

// append and display alert for city not found or invalid city name
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

// determine the lat and lon for the in city
function determineLatLon(inCity) {
  // fetch city
  let strCity = inCity || $("#input-city").val();
  const geocodingURL = `https://api.openweathermap.org/geo/1.0/direct?q=${strCity}&limit=1&appid=${apiKey}`;
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
            $("#input-city").val();
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
        alert(`Error:${response.statusText}`);
      }
    })
    // on not found 404
    .catch(function (error) {
      alert("Unable to connect to openweathermap.org");
    });
}

// get today's weather only
function determineToday({ Lat, Lon }, cityVal) {
  const openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${Lat}&lon=${Lon}&units=imperial&cnt=48&appid=${apiKey}`;
  fetch(openWeatherURL)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          // pass the data for today to storeCity and calcToday functions
          storeCityCreateButton(data, cityVal);
          calculateToday(data);
          // console.log(data);
        });
      } else {
        alert(`Error:${response.statusText}`);
      }
    })
    .catch(function (error) {
      alert("Unable to connect to openweathermap.org");
    });
}

// store city in local storage and create a button for that city
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

// display the buttons on screen for each city stored in local storage
function renderButtons() {
  let arrCities = JSON.parse(localStorage.getItem("cityInfo")) || [];
  let strEle = "";
  eleAppendSearches.empty();
  for (let cities in arrCities) {
    strEle = `${strEle}<button type="button" 
    id=${arrCities[cities].Search.replace(" ", "-")} class="btn btn-primary btn-city 
    w-100 mb-2">${arrCities[cities].Display}</button>`;
  }
  eleAppendSearches.append(strEle);
}

// destructure the data and pass to the function to calc averages
function calculateToday({ name, main, wind, weather, dt }) {
  // console.log(data);
  let today = dayjs.unix(dt);
  calculateDisplayAverages(name, main.temp, main.humidity, wind.speed, 1, today, true, weather);
}

function determineFiveDay({ Lat, Lon }) {
  // call function to return lat/longitude
  const openWeatherURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${Lat}&lon=${Lon}&units=imperial&cnt=48&appid=${apiKey}`;
  fetch(openWeatherURL)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          calculateFiveDay(data);
          // console.log(data);
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
    curTime,
    thisDate,
    desc,
    icon;
  const strCity = city.name;
  for (let obj of list) {
    thisDate = obj.dt_txt.split(" ")[0];
    // check to see if the currdate is equal to the date split from the data above
    if (curDate === thisDate) {
      tempSum += obj.main.temp;
      humSum += obj.main.humidity;
      windSum += obj.wind.speed;
      curTime = obj.dt_txt.split(" ")[1];
      // instead of using the most frequent icon we will use the icon for mid-day (12:00 PM)
      desc = curTime == "12:00:00" ? obj.weather[0].description : desc;
      icon = curTime == "12:00:00" ? obj.weather[0].icon : icon;
      counts++;
    }
    // new day - so take the sums and divide by the counts to get the means and send them to the display function
    else {
      // if current date is not today, display below
      if (curDate !== dayjs().format("YYYY-MM-DD"))
        calculateDisplayAverages(strCity, tempSum, humSum, windSum, counts, curDate, false, "", desc, icon);
      // increment day count and set the temp values to the first value found for the day, reset the counts to 1 and update the date
      tempSum = obj.main.temp;
      humSum = obj.main.humidity;
      windSum = obj.wind.speed;
      curDate = thisDate;
      desc = obj.weather[0].description;
      icon = obj.weather[0].icon;
      counts = 1;
    }
  }
  calculateDisplayAverages(strCity, tempSum, humSum, windSum, counts, curDate, false, "", icon, icon);
}

// no longer used, we were finding the most frequent icon's in an array of strings and returning the value
function determineIcon(arrWeather) {
  // COUNT THE NUMBER OF EACH DESCRIPTION IN THE ARRAY AND DETERMINE THE DESCRIPTION THAT IS MOST FREQUENT
  let objMap = {};
  let weatherDesc;
  let mostFrequent = 0;
  for (let str of arrWeather) {
    if (objMap[str]) {
      objMap[str]++;
    } else {
      objMap[str] = 1;
    }
    if (objMap[str] > mostFrequent) {
      weatherDesc = str;
      mostFrequent = objMap[str];
    }
  }
  return weatherDesc;
}

//  simple calulation function that then passes the values to the display function
function calculateDisplayAverages(strCity, tempSum, humSum, windSum, counts, curDate, bool, weather, desc, icon) {
  const meanTemp = parseFloat(tempSum / counts).toFixed(2);
  const meanHum = parseFloat(humSum / counts).toFixed(0);
  const meanWind = parseFloat(windSum / counts).toFixed(2);
  displayWeather(strCity, meanTemp, meanHum, meanWind, curDate, bool, weather, desc, icon);
}

// simple clear element function
function clearElements() {
  eleTodayParent.empty();
  eleTodayParent.css("border-style", "none");
  eleFiveDayParent.empty();
}

// display the weather for today OR the cards on screen for the 5 day
function displayWeather(city, temp, humidity, wind, date, isToday, weather, desc, icon) {
  let strAppend;
  if (isToday === true) {
    strAppend = `<h2>${city} (${dayjs(date).format("M/D/YYYY")})`;
    strAppend = `${strAppend}<img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}"></h2>`;
    strAppend = `${strAppend}<p>Temp: ${temp} °F</p>`;
    strAppend = `${strAppend}<p>Wind: ${wind} MPH</p>`;
    strAppend = `${strAppend}<p>Humidity: ${humidity}%</p>`;
    eleTodayParent.css("border-style", "solid");
    eleTodayParent.append(strAppend);
    eleFiveDayParent.append(`<h3>5-Day Forecast Averages:</h3>`);
  } else {
    strAppend = `<div class="card text-white bg-info mb-3 col-lg-2 col-md-6 col-sm-12">`;
    strAppend = `${strAppend}<div class="card-header head">${dayjs(date).format("M/D/YYYY")}</div>`;
    strAppend = `${strAppend}<div class="card-body">`;
    strAppend = `${strAppend}<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">`;
    strAppend = `${strAppend}<p class="p-font">Temp: ${temp} °F</p>`;
    strAppend = `${strAppend}<p class="p-font">Wind: ${wind} MPH</p>`;
    strAppend = `${strAppend}<p class="p-font">Humidity: ${humidity}%</p>`;
    strAppend = `${strAppend}</div></div>`;
    eleFiveDayParent.append(strAppend);
  }
}

// on ready make sure that the submit button and append seaches sections have event listeners for onclick
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
    if ($(event.target).is("button")) {
      clearElements();
      determineLatLon(strID.replace("-", " "));
    }
  });
});
