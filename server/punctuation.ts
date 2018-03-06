require('dotenv').config();

import * as request from 'request';

export function addPunctuation(utterance): string {

    var postBody = [{"Text":"hello how are you doing i am fine thanks"}];
    
    var options = {
        method: 'post',
        body: postBody, // Javascript object
        json: true, // Use,If you are sending JSON data
        url: "https://dev.microsofttranslator.com/translate?api-version=3.0&from=en&to=en&options=TrueText",
        headers: {
            "Ocp-Apim-Subscription-Key": process.env.TRANSLATOR_KEY,
            "Content-Type":"application/json",
            "X-ClientTraceId":"A14C9DB9-0DED-48D7-8BBE-C517A1A8DBB0"
        }
      }

      let translateResponse = "";

    request.post(options,
        function (err,
            response, body) {
            if (err)
                console.log(err);
            else {
                console.log(body);
                var data = JSON.parse(body);

                if (data.translations.length > 0) {
                    data.translations.forEach(translation => {
                        console.log(`Translation: ${translation.text}`);
                    });
                }
            }
        });
    return translateResponse;
}
