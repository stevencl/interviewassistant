import * as luis from './luis';
import * as Messages from './Messages';
import * as Suggestions from './suggestions';

const closedQuestionReference: { [prefix: string]: string[] } = {
    'did': ['you', 'this', 'that', 'i', 'it', 'they'],
    'do': ['you', 'i', 'they'],
    'are': ['you', 'they'],
    'am': ['i'],
    'is': ['this', 'that', 'it'],
    'will': ['this', 'that', 'you', 'i', 'it', 'they'],
    'can': ['you', 'this', 'that', 'i', 'it', 'they'],
    'were': ['you', 'they'],
    'does': ['it', 'this', 'that'],
    'could': ['you', 'i', 'that', 'this', 'it', 'they'],
    'would': ['you', 'i', 'that', 'this', 'it', 'they'],
    'should': ['you', 'i', 'that', 'this', 'it', 'they']
};

function detectClosedQuestion(sentence) {
    const splitSentence = sentence.split(" ", 2);
    if (splitSentence && splitSentence.length == 2) {
        const list = closedQuestionReference[splitSentence[0].toLowerCase()];
        if (list && list.indexOf(splitSentence[1].toLowerCase()) > -1) {
            console.log("Detected closed question" + sentence);
            return true;
        }
    }
    return false;
}

export function handleTextAnalytics(ws, punctuatedUtterance: Messages.IMessageData) {
    console.log("Received " + punctuatedUtterance + "from addPunct");
    punctuatedUtterance.content.text.split(/[".?;]+/).forEach(sentence => {
        console.log("Split: " + sentence);
        if (sentence != null) {
            luis.getLuisIntent(sentence, (response) => {
                const luisResponse = EvaluateLUISResponse(response);
                console.log(luisResponse);
                if (luisResponse != null) {
                    punctuatedUtterance.content.luisResponse = luisResponse;
                    console.log("Adding luis response");
                    ws.send(JSON.stringify(<Messages.IMessageData>{
                        messageType: Messages.LUIS_TYPE,
                        content: punctuatedUtterance.content
                    }));
                }
            });
        }
    });
}

type intent = {
    intent: string;
    score: number;
}

type luisJSON = {
    query: string;
    intents: intent[];
    topScoringIntent: intent;
}

function isQuestion(text) {
    if (text[text.length - 1] === "?") {
        return true;
    }
    return false;
}

function getSuggestion(intent) {
    switch (intent) {
        case Suggestions.CLOSED_QUESTION:
            return Suggestions.CLOSED_QUESTION_SUGGESTION;
        case Suggestions.LEADING_QUESTION:
            return Suggestions.LEADING_QUESTION_SUGGESTION;
        case Suggestions.JTBD_HOW:
        case Suggestions.JTBD_HOWMUCH:
        case Suggestions.JTBD_WHEN:
        case Suggestions.JTBD_WHERE:
        case Suggestions.JTBD_WHOWHAT:
        case Suggestions.JTBD_WHY:
            return Suggestions.JTBD_SUGGESTION;
        case Suggestions.PROBLEM_HOW:
        case Suggestions.PROBLEM_HOWMUCH:
        case Suggestions.PROBLEM_WHEN:
        case Suggestions.PROBLEM_WHERE:
        case Suggestions.PROBLEM_WHY:
        case Suggestions.PROBLEM_WHOWHAT:
            return Suggestions.PROBLEM_SUGGESTION;
        default:
            return Suggestions.DEFAULT_SUGGESTION;
    }
}

function EvaluateLUISResponse(response) {
    if (response != null) {
        let luisResult: luisJSON = JSON.parse(response);
        if (luisResult.query == null) {
            return;
        }
        const isClosedQuestion = detectClosedQuestion(luisResult.query);
        const luisResponse = <Messages.LuisResponse>{ analyzedText: luisResult.query, suggestions: [] };
        const topResponse = luisResult.topScoringIntent;
        const primaryThreshold = isQuestion(luisResult.query) ? Suggestions.PRIMARY_QUESTION_SUGGESTION_THRESHOLD : Suggestions.PRIMARY_SUGGESTION_THRESHOLD;
        const secondaryThreshold = isQuestion(luisResult.query) ? Suggestions.SECONDARY_QUESTION_SUGGESTION_THRESHOLD : Suggestions.SECONDARY_SUGGESTION_THRESHOLD;
        //Evaluate the top scoring intent first
        if (topResponse == null) {
            //No significant response
            return null;
        }

        if (topResponse.intent == Suggestions.CLOSED_QUESTION) {
            // Ignore score if top intent is closed question and instead check for the prefix.
            if (isClosedQuestion) {
                luisResponse.suggestions.push(getSuggestion(topResponse.intent));
            } else {
                return null;
            }
        } else if (topResponse.score > primaryThreshold && topResponse.intent != Suggestions.NONE && topResponse.intent != Suggestions.COMMUNICATION_CONFIRM) {
            // Significant top response.
            luisResponse.suggestions.push(getSuggestion(topResponse.intent));
        } else {
            // No significant response
            return null;
        }

        //Evaluate secondary intents if there are any
        if (luisResult.intents != null) {
            for (const intent of luisResult.intents) {
                if (intent.intent == topResponse.intent) {
                    continue;
                } //Ignore top response in these checks
                if (intent.score > secondaryThreshold && intent.intent != "None") {
                    luisResponse.suggestions.push(getSuggestion(intent.intent));
                }
            }
        }
        return luisResponse;
    }
}