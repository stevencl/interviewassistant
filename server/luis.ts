require('dotenv').config();

//var request = require('request');
import * as request from 'request';

var querystring = require('querystring');

export function getLuisIntent(utterance): string {
    var endpoint =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";

    // Set the LUIS_APP_ID environment variable 
    var luisAppId = process.env.LUIS_APP_ID;

    // Set the LUIS_SUBSCRIPTION_KEY environment variable
    // to the value of your Cognitive Services subscription key
    var queryParams = {
        "subscription-key": process.env.LUIS_SUBSCRIPTION_KEY,
        "timezoneOffset": "0",
        "verbose":  true,
        "q": utterance
    }

    var luisRequest =
        endpoint + luisAppId +
        '?' + querystring.stringify(queryParams);
    var luisResponse = "";
    request(luisRequest,
        function (err,
            response, body) {
            if (err)
                console.log(err);
            else {
                console.log(body);
                var data = JSON.parse(body);

                console.log(`Query: ${data.query}`);
                if (data.intents.length > 0) {
                    console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                    console.log('Intents:');
                    console.log(data.intents);
                }
                luisResponse = body;
            }
        });
    return luisResponse;
}

// Pass an utterance to the sample LUIS app
//getLuisIntent('turn on the left light');