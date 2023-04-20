/*
1. Get day from date.
2. Fetch availability of that day.
3. Compare the time given to all the objects in the day array.
4. Return true if available otherwise false. 
*/

const express = require("express");
const bodyparser = require("body-parser");
const request = require("request");
const fs = require("fs");  //fs is used to fetch data from local file, if we want to fetch data from api, we will use Axios.
const moment = require("moment");
// const { default: axios } = require("axios");

const app = express();


//initializing variables to store value required by different functions
let day;
let day_availability;
let input_time;
let input_date;


app.use(bodyparser.json());


// Function to convert string time to minutes.
let time_to_minutes = function (time) {
    let a = time.split(':');
    let minutes = (+a[0]) * 60 + (+a[1]);
    parseInt(minutes);
    return minutes;
}

// Function to get day from input date.
let date_to_day = function (date) {
    let day_array = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let final_date = moment(date).format("MMMM D, YYYY") // moment is used to format date 
    let function_date = new Date(final_date);
    let day1 = function_date.getDay();
    day = day_array[day1].toLowerCase();
    return day;
};


//Function to read data from availability.json.
let given_data = function (day_data) {
    let rawdata = fs.readFileSync('public/availability.json'); // reading availability.json to fetch the given data
    let availability = JSON.parse(rawdata);
    day_availability = availability.availabilityTimings[day_data];
    return day_availability;
};


//Function to check if time is between given range.
let available_time = function (input_time, input_date) {
    let final_response;
    let flag = 0; // this is to check conditions and maintain response
    for (let i = 0; i < day_availability.length; i++) {
        let startTime = time_to_minutes(day_availability[i].start);
        let endTime = time_to_minutes(day_availability[i].end);
        if (input_time >= startTime && input_time < endTime) {
            final_response = {
                "isAvailable": "true"
            }
            flag = 1;
            break;
        }
    }

    if (flag == 0) {
        for (let i = 0; i < day_availability.length; i++) {
            let startTime = time_to_minutes(day_availability[i].start);
            if (input_time < startTime) {
                final_response = {
                    "isAvailable": "false",
                    "nextTimeSlotAvailable": {
                        "date": input_date,
                        "time": day_availability[i].start
                    }
                }
                flag = 1;
                break;
            }

        }
    }
    if (flag == 0) {
        let next_day;
        let next_date = moment(input_date).add(1, "days").format("YYYY-MM-DD");
        next_day = date_to_day(next_date);
        given_data(next_day);
        while (day_availability.length == 0) {
            next_date = moment(next_date).add(1, "days").format("YYYY-MM-DD");
            next_day = date_to_day(next_date);
            given_data(next_day);
        }
        final_response = {
            "isAvailable": "false",
            "nextAvailableSlot": {
                "date": next_date,
                "time": day_availability[0].start
            }
        }
    }
    return final_response;
};

//Post request and response.
app.post("/", (req, res) => {

    //Requesting from client
    input_date = req.body.date;
    input_timeinstring = req.body.time;
    input_time = time_to_minutes(input_timeinstring);

    //Calling the functions.
    date_to_day(input_date);
    given_data(day);


    //Responding to client
    res.send(available_time(input_time, input_date));
})

//Get request and response.
app.get("/", (req, res) => {
    res.send("Welcome");
});

//Listening on port number.
const port = process.send.PORT || 3000
app.listen(port, () => {
    console.log(`Listening on port ${port}......`);
})