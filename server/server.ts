import * as express from 'express';
import * as ws from 'express-ws';
import * as luis from './luis';
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

function handleTextAnalytics(msg){
	let duration: number | undefined = undefined;
	let text: string | undefined = undefined;
	let startTimeText: string | undefined = undefined;
	const parsedMsg = JSON.parse(msg);
	duration = parsedMsg.duration;
	startTimeText = parsedMsg.startTimeText;
	text = parsedMsg.text;
	//Send message to LUIS service
	const response = sendTextToLUIS(text);
	console.log("received " + response.toString());
	//const msg1 = "Hello. You asked a leading question: " + text;
	//insertPhrase(db, startTimeText, duration, text);
	if (response != "") {
		console.log(response);
		//ws.send(JSON.stringify(response));
	}
}

const sessions: Session[] = [];
const clients: { [clientId: string]: WebSocket } = {};

app.ws('/createSession', (interviewerWs, req) =>{
	const sessionId = generateGUID();
	const interviewerId = generateGUID();
	const session = new Session(sessionId, interviewerId);
	console.log
	sessions.push(new Session(sessionId, interviewerId));

	// Send the interviewer the session ID to give to the interviewee
	console.log('sending interviewer the session id: ' + sessionId);
	interviewerWs.send(sessionId);
});

app.ws('/', (ws, req) => {
	console.log(req.url);
	const parameters = URL.parse(req.url, true);
	console.log(parameters);
	const sessionId = parameters["query"]["sessionId"];
	const interviewer = parameters["query"]["interviewer"];
	console.log("interviewer: " + interviewer);
	console.log('a client is trying to connect');
	console.log(sessionId);

	if (sessionId == null) {
		// Not trying to join an existing session
		return;
	}

	if(interviewer === 'true') {
		let interviewerId: string | null = null;
		for (let i=0; i < sessions.length; ++i) {
			if (sessions[i].sessionId === sessionId) {
				console.log('found matching session for client: ' + sessionId);
				clients[sessions[i].interviewerId] = ws;
				interviewerId = sessions[i].interviewerId;
			}
		}
		console.log("interviewer ws setup");
		ws.on('message', msg => {
			console.log('received a message from interviewer', msg);

			for (const session of sessions) {
				if (session.interviewerId == interviewerId) {
					console.log('forwarding message from interviewer to interviewee if interviewee has connected');
					if(session.intervieweeId != null){
						clients[session.intervieweeId].send(msg);
					}
					handleTextAnalytics(msg);
				}
			}
		});
	} else {
		let intervieweeId: string | null = null;
		console.log("hi");
		for (let i=0; i < sessions.length; ++i) {
			if (sessions[i].sessionId === sessionId) {
				console.log('found matching session for client: ' + sessionId);

				intervieweeId = generateGUID();
				sessions[i].intervieweeId = intervieweeId;
				clients[intervieweeId] = ws;
			}
		}
			
		if (intervieweeId == null) {
			return;
		}
		ws.on('message', msg => {
			console.log('received a message from interviewee', msg);
	
			for (const session of sessions) {
				if (session.intervieweeId == intervieweeId) {
					console.log('forwarding message from interviewee to interviewer');
					clients[session.interviewerId].send(msg);
				}
			}
		});
	}
});

// app.ws.on('message', (ws, req) => {
// 	var aWss = expressWs.getWss('/' + sessionId);
// 	const data = JSON.parse(d);

// 	console.log('Received a message from the client:');
// 	console.log(data);

// 	if(!data.interviewer) {
// 		aWss.clients.forEach(function (c) {
// 			console.log("hi:" + d);
// 			ws.send(d);
// 		});
// 	}
// });

app.ws('/interviewee', (ws, req) =>{

});

const PORT = 3000;

app.listen(PORT, () => {
	console.log('Web server running in http://localhost:' + PORT);
});

class Session {
	public sessionId: string;
	public interviewerId: string;
	public intervieweeId: string;

	constructor(sessionId: string, interviewerId: string) {
		this.sessionId = sessionId;
	}
}
