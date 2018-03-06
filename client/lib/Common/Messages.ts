export interface IMessageData {
    messageType: string;
    content: any; // how to do signature for object with any properties?
}

export const UTTERANCE_TYPE = 'UTTERANCE';
export const LUIS_TYPE = 'LUIS';
export interface IUtteranceContent {
    key: string;
    speaker: "interviewer" | "interviewee";
    text: string;
    duration: number;
    startTime: string;
    luisResponse: LuisResponse
}

export class LuisResponse{
	analyzedText: string | undefined;
	statementTypes: {[statementType: string] : string };
	constructor(analyzedText: string){
		this.analyzedText = analyzedText;
		this.statementTypes = {};
	}
}

export const INTERVIEWEE_JOINED_TYPE = 'INTERVIEWEE_JOINED';
export interface IIntervieweeJoinedContent {
    interviewerName: string;
    intervieweeName: string;
}

export const URL_FOR_INTERVIEWEE_TYPE = 'URL_FOR_INTERVIEWEE_TYPE';
export interface IUrlForIntervieweeContent {
    urlForInterviewee: string;
}

