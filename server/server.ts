import * as express from 'express';
import * as ws from 'express-ws';
import * as luis from './luis';
import * as punctuation from './punctuation';
import * as URL from 'url';
import * as Messages from './Messages';
import * as Suggestions from './suggestions';

//function insertPhrase(db, startTime, duration, phrase: string | undefined) {
//	var text = "";
//	if (phrase !=undefined) {
//		text = phrase;
//	}
//	db.collection('interviews').insertOne( {
//		"id": "testInterview",
//		"startTime": startTime,
//		"duration": duration,
//		"phrase": text
//	}).then(function(result) {
//		console.log("Inserted a phrase in the phrase collection");
//	}).catch(function(err) {
//		console.log("Could not insert record");
//	});

//}


function generateGUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}


const app = express();
//const expressWs = ws(app);

app.use(express.static(__dirname + '/..'));

//function openDBConnection(){
//	var mongoClient = require("mongodb").MongoClient;
//	var password = encodeURIComponent("RFtVpFkJ3uR4MTptTTrIvOtHKLOVSRhxSqD51mEMvUnbL3FxHSRtEkqoRAQZ3i3iDpV3qDkOlf3G4rVI5a9jBw==");
//	mongoClient.connect("mongodb://interviewtranscript:" + password + "@interviewtranscript.documents.azure.com:10255/?ssl=true")
//	.then(function (database) {})
//	.catch(function (err) {
//		console.log("Database connection was not created properly");
//		console.log("error opening", err);
//	});
//}

function getSuggestion(intent){
	switch(intent){
		case Suggestions.CLOSED_QUESTION_RESPONSE:
			return Suggestions.CLOSED_QUESTION_SUGGESTION;
		case Suggestions.LEADING_QUESTION_RESPONSE:
			return Suggestions.LEADING_QUESTION_SUGGESTION;
		case Suggestions.JTBD_RESPONSE:
			return Suggestions.JTBD_SUGGESTION;
		default:
			return Suggestions.DEFAULT_SUGGESTION;
	}
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

function EvaluateLUISResponse(response) {
	if (response != null) {
		let luisResult: luisJSON = JSON.parse(response);
		const luisResponse = <Messages.LuisResponse>{analyzedText: luisResult.query, suggestions: []};
        const topResponse = luisResult.topScoringIntent;
        const primaryThreshold = isQuestion(luisResult.query) ? Suggestions.PRIMARY_QUESTION_SUGGESTION_THRESHOLD : Suggestions.PRIMARY_SUGGESTION_THRESHOLD;
        const secondaryThreshold = isQuestion(luisResult.query) ? Suggestions.SECONDARY_QUESTION_SUGGESTION_THRESHOLD : Suggestions.SECONDARY_SUGGESTION_THRESHOLD;
		//Evaluate the top scoring intent first
		if(topResponse == null){
			//No significant response
			return null;
		}

		if(topResponse.score > primaryThreshold && topResponse.intent != "None"){
			// Significant top response.
			luisResponse.suggestions.push(getSuggestion(topResponse.intent));
		} else{
			// No significant response
			return null;
		}

		//Evaluate secondary intents if there are any
		if (luisResult.intents != null){
			for (const intent of luisResult.intents) {
				if(intent.intent == topResponse.intent){ continue; } //Ignore top response in these checks
				if(intent.score > secondaryThreshold && intent.intent != "None"){
					luisResponse.suggestions.push(getSuggestion(intent.intent));
				}
			}
		}
		return luisResponse;
	}
}

function handleTextAnalytics(ws, msg){
	const utterance = JSON.parse(msg);
	const text = utterance.content.text;
	//Send message to LUIS service
	if(text == null){
		return;
	}
	punctuation.addPunctuation(text, (punctuatedText) => {
		console.log("Received " + punctuatedText + "from addPunct");
		punctuatedText.split(/[".?;]+/).forEach(sentence => {
			console.log("Split: " + sentence);
			if(sentence != null){
				luis.getLuisIntent(sentence, (response) => {
					const luisResponse = EvaluateLUISResponse(response);
					console.log(luisResponse);
					utterance.luisResponse = luisResponse;
					if(luisResponse != null){
						console.log("Adding luis response");
						ws.send(JSON.stringify(<Messages.IMessageData>{
							messageType: Messages.LUIS_TYPE, 
							content: utterance.content
						}));
					}
				});
			}
		});
	});
}

const sessions: { [sessionId: string]: Session } = {};
const clients: { [clientId: string]: WebSocket } = {};

// Interviewer connects to this websocket to establish the session and it is also used to send messages
app.ws('/createSession', (interviewerWs, req) => {
	const parameters = URL.parse(req.url, true);

	if (parameters == null || parameters["query"] == null) {
		console.log('Invalid parameters, returning');
		ws.close();
		return; 
	}

	const interviewerName: string = <string>parameters["query"]!["interviewerName"];
	console.log('An interviewer is trying to create a session with name: ' + interviewerName)

	if (interviewerName == null) {
		ws.close();
		return;
	}

	const sessionId = generateGUID();
	const interviewerId = generateGUID();
	const session = new Session(sessionId, interviewerId, interviewerName);
	sessions[sessionId] = session;

	// Send the interviewer the session ID to give to the interviewee
	console.log('sending interviewer the session id: ' + sessionId);
	interviewerWs.send(JSON.stringify(<Messages.IMessageData>{
		messageType: Messages.URL_FOR_INTERVIEWEE_TYPE,
		content: {
			urlForInterviewee: `localhost:3000/#/interviewee?sessionId=${sessionId}`
		}
	}));

	// Add interviewer WS to clients
	clients[interviewerId] = interviewerWs;

	interviewerWs.on('message', msg => {
		console.log('Received a message from interviewer', msg);
		// Don't need to send anything to the interviewee

		// let intervieweeId: string | null = null;
		// Get interviewee ID from session
		// for (const id of Object.keys(sessions)) {
		// 	if (sessions[id].interviewerId == interviewerId) {
		// 		intervieweeId = sessions[id].intervieweeId;
		// 	}
		// }

		// if (intervieweeId != null) {
		// 	console.log('forwarding message from interviewer to interviewee if interviewee has connected');
		// 	const message = JSON.parse(msg);
		// 	message.messageType = 'transcript';
		// 	clients[intervieweeId].send(JSON.stringify(message));
		// }
		handleTextAnalytics(interviewerWs, msg);
	});
});

// Interviewee connects to this to connect to an existing session and it is also used to send messages
app.ws('/', (ws, req) => {
	const parameters = URL.parse(req.url, true);

	if (parameters == null || parameters["query"] == null) {
		console.log('Invalid parameters, returning');
		ws.close();
		return; 
	}

	const sessionId: string = <string>parameters["query"]!["sessionId"];
	console.log('A client is trying to connect with sessionID: ' + sessionId)

	if (sessionId == null) {
		// Not trying to join an existing session
		ws.close();
		return;
	}

	// Check whether session ID corresponds to an existing session
	if (!sessions[sessionId]) {
		console.log('Not a valid session ID');
		ws.close();
		return;
	}

	const session: Session = sessions[sessionId];
	console.log('found matching session for client: ' + sessionId);

	// Generate interviewee ID, update session state with it and keep track of interviewee in clients
	const intervieweeId = generateGUID();
	sessions[sessionId].intervieweeId = intervieweeId;
	clients[intervieweeId] = ws;

	// Let the interviewer know that the interviewee has joined
	const interviewerId = sessions[sessionId].interviewerId;
	clients[interviewerId].send(JSON.stringify(<Messages.IMessageData>{
		messageType: Messages.INTERVIEWEE_JOINED_TYPE,
		content: <Messages.IIntervieweeJoinedContent>{
			interviewerName: sessions[sessionId].intervieweeName,
			intervieweeName: sessions[sessionId].intervieweeName
		}
	}));

	ws.on('message', (msg) => {
		console.log('received a message from interviewee', msg);
		console.log('forwarding message from interviewee to interviewer');

		const message: Messages.IMessageData = <Messages.IMessageData>JSON.parse(msg);
		clients[session.interviewerId].send(JSON.stringify(message));
	});
});

const PORT = 3000;

app.listen(PORT, () => {
	console.log('Web server running in http://localhost:' + PORT);
});

class Session {
	public sessionId: string;
	// Note: only 1 interviewer and 1 interviewee per session
	public interviewerId: string;
	public intervieweeId: string;
	public interviewerName: string;
	public intervieweeName: string = "IntervieweeName";

	constructor(sessionId: string, interviewerId: string, interviewerName: string) {
		this.sessionId = sessionId;
		this.interviewerId = interviewerId;
		this.interviewerName = interviewerName;
	}
}