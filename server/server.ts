import * as express from 'express';
import * as ws from 'express-ws';
import * as luis from './luis';
import * as punctuation from './punctuation';
import * as URL from 'url';

function insertPhrase(db, startTime, duration, phrase: string | undefined) {
	var text = "";
	if (phrase !=undefined) {
		text = phrase;
	}
	db.collection('interviews').insertOne( {
		"id": "testInterview",
		"startTime": startTime,
		"duration": duration,
		"phrase": text
	}).then(function(result) {
		console.log("Inserted a phrase in the phrase collection");
	}).catch(function(err) {
		console.log("Could not insert record");
	});

}

function sendTextToLUIS(text: string | undefined) {
	let response: string;
	response = "";
	if (text != undefined) {
		response = luis.getLuisIntent(text);
	}
	return response;
}
function generateGUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}


const app = express();
const expressWs = ws(app);

app.use(express.static(__dirname + '/..'));

function openDBConnection(){
	var mongoClient = require("mongodb").MongoClient;
	var password = encodeURIComponent("RFtVpFkJ3uR4MTptTTrIvOtHKLOVSRhxSqD51mEMvUnbL3FxHSRtEkqoRAQZ3i3iDpV3qDkOlf3G4rVI5a9jBw==");
	mongoClient.connect("mongodb://interviewtranscript:" + password + "@interviewtranscript.documents.azure.com:10255/?ssl=true")
	.then(function (database) {})
	.catch(function (err) {
		console.log("Database connection was not created properly");
		console.log("error opening", err);
	});
}

class LUISResponse{
	id: string;
	analyzedText: string | undefined;
	statementType: string;
	secondaryStatementTypes: string[];
	constructor(id: string, analyzedText: string, statementType: string){
		this.id = id;
		this.analyzedText = analyzedText,
		this.statementType = statementType,
		this.secondaryStatementTypes = [];
	}
}

function EvaluateLUISResponse(response){
	const primaryStatementThreshold = 0.75;
	const secondaryStatementThreshold = 0.6;
	const primaryQuestionThreshold = 0.6;
	const secondaryQuestionThreshold = 0.45;
	const luisResponse = new LUISResponse('hi', response.text, "None");
	if (response != null) {
		console.log(response);
		const luisResult = JSON.parse(response);
		const topResponse = luisResult.topScoringIntent;
		//Evaluate the top scoring intent first
		if(topResponse == null){
			//No significant response
			return null;
		}

		if(+topResponse.score > primaryStatementThreshold && topResponse.intent != "None"){
			// Significant top response.
			luisResponse.statementType = topResponse.intent;
		} else{
			// No response is significant
			return null;
		}

		//Evaluate secondary intents if there are any
		if (luisResult.intents != null){
			for (const intent in luisResult.intents){
				if(intent.intent == topResponse.intent){ continue; } //Ignore top response in these checks
				if(+intent.score > secondaryStatementThreshold && topResponse.intent != "None"){
					luisResponse.secondaryStatementTypes.push(intent.intent);
				}
			}
		}
	}
	return luisResponse;
}

function handleTextAnalytics(ws, msg){
	let duration: number | undefined = undefined;
	let text: string | undefined = undefined;
	let startTimeText: string | undefined = undefined;
	const parsedMsg = JSON.parse(msg);
	duration = parsedMsg.duration;
	startTimeText = parsedMsg.startTimeText;
	text = parsedMsg.text;
	//Send message to LUIS service
	if(text == null){
		return;
	}
	const luisResponses: LUISResponse[] = [];
	punctuation.addPunctuation(text, (punctuatedText) => {
		console.log("Received " + punctuatedText + "from addPunct");
		punctuatedText.split(/[".?;]+/).forEach(sentence => {
			console.log("Split: " + sentence);
			const response = sendTextToLUIS(sentence);
			const luisResponse = EvaluateLUISResponse(response);
			if(luisResponse != null){
				luisResponses.push(luisResponse);
			}
		});
	});
	ws.send(JSON.stringify({messageType: 'LUIS', luisResponses: luisResponses}));
}

const sessions: { [sessionId: string]: Session } = {};
const clients: { [clientId: string]: WebSocket } = {};

// Interviewer connects to this websocket to establish the session and it is also used to send messages
app.ws('/createSession', (interviewerWs, req) =>{
	const sessionId = generateGUID();
	const interviewerId = generateGUID();
	const session = new Session(sessionId, interviewerId);
	sessions[sessionId] = session;

	// Send the interviewer the session ID to give to the interviewee
	console.log('sending interviewer the session id: ' + sessionId);
	interviewerWs.send(sessionId);
	
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
		return; 
	}

	const sessionId = parameters["query"]!["sessionId"];
	console.log('A client is trying to connect with sessionID: ' + sessionId)

	if (sessionId == null) {
		// Not trying to join an existing session
		return;
	}

	// Check whether session ID corresponds to an existing session
	if (!sessions[sessionId]) {
		console.log('Not a valid session ID');
		return;
	}

	const session: Session = sessions[sessionId];
	console.log('found matching session for client: ' + sessionId);

	// Generate interviewee ID, update session state with it and keep track of interviewee in clients
	const intervieweeId = generateGUID();
	sessions[sessionId].intervieweeId = intervieweeId;
	clients[intervieweeId] = ws;
	ws.on('message', (msg) => {
		console.log('received a message from interviewee', msg);
		console.log('forwarding message from interviewee to interviewer');

		const message = JSON.parse(msg);
		message.messageType = 'transcript';
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

	constructor(sessionId: string, interviewerId: string) {
		this.sessionId = sessionId;
	}
}
