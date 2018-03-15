require('dotenv').config();

import * as request from 'request';

export function addPunctuation(utterance, callback) {

    var postBody = [{ "Text": utterance }];

    var options = {
        method: 'post',
        body: postBody, // Javascript object
        json: true, // Use,If you are sending JSON data
        url: "https://dev.microsofttranslator.com/translate?api-version=3.0&from=en&to=en&options=TrueText",
        headers: {
            "Ocp-Apim-Subscription-Key": process.env.TRANSLATOR_KEY,
            "Content-Type": "application/json",
            "X-ClientTraceId": "A14C9DB9-0DED-48D7-8BBE-C517A1A8DBB0"
        }
    }

    let translateResponse = utterance;

    request.post(options,
        function (err,
            response, body) {
            if (err)
                console.log(err);
            else {
                console.log("Got a response from translator: ");
                if (body !== undefined) {
                    console.log(body);
                    if (body[0] !== undefined) {
                        console.log(body[0].trueText.text);
                        translateResponse = body[0].trueText.text;
                    }
                }
                else if (response !== undefined) {
                    console.log("No body, got response instead: " + response);
                }
            }
            return callback(translateResponse);
        });

}
