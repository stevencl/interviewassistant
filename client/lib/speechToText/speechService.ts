import * as Speech from './Speech.Browser.Sdk';
import { Emitter, Event } from './util';

function RecognizerSetup(subscriptionKey): Speech.Recognizer {
	var recognizerConfig = new Speech.RecognizerConfig(
		new Speech.SpeechConfig(
			new Speech.Context(
				new Speech.OS(navigator.userAgent, "Browser", null),
				new Speech.Device("SpeechSample", "SpeechSample", "1.0.00000"))),
		Speech.RecognitionMode.Conversation,
		"en-us",
		Speech.SpeechResultFormat.Simple,
	);

	// Alternatively use SDK.CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) for token auth
	var authentication = new Speech.CognitiveSubscriptionKeyAuthentication(subscriptionKey);

	return Speech.CreateRecognizer(recognizerConfig, authentication);

	//If we are able to install the opus codec, this is how we would use it:
	// return Speech.CreateRecognizerWithCustomAudioSource(recognizerConfig, authentication, 
	// 	new Speech.MicAudioSource(
	// 			 new Speech.OpusRecorder(
	// 			 {
	// 				 mimeType: "audio/ogg",
	// 				 bitsPerSecond: 32000
	// 			 }
	// 	  )
	//   )); 
}

export class SpeechPausedResult {
	readonly text: string;
	readonly offset: number;
	readonly duration: number;

	constructor(text: string, offset: number, duration: number) {
		this.text = text;
		this.offset = offset;
		this.duration = duration;
	}
}

export class SpeechToTextService {

	private recognizer: Speech.Recognizer;

	// private _onSpeechPaused: Emitter<string> = new Emitter<string>();
	// readonly onSpeechPaused: Event<string> = this._onSpeechPaused.event;
	private _onSpeechPaused: Emitter<SpeechPausedResult> = new Emitter<SpeechPausedResult>();
	readonly onSpeechPaused: Event<SpeechPausedResult> = this._onSpeechPaused.event;

	private lastText: string = '';
	private lastOffset: number;
	private lastDuration: number;
	private _onText: Emitter<string> = new Emitter<string>();
	readonly onText: Event<string> = this._onText.event;

	constructor(private subscriptionKey: string) {
		this.recognizer = RecognizerSetup(subscriptionKey);
		this.recognizer.AudioSource.TurnOn();
	}

	start(): void {
		this.recognizer.Recognize((event: Speech.SpeechRecognitionResultEvent<any>) => {

			if (event instanceof Speech.RecognitionTriggeredEvent) {
				console.log("Initializing");
			}

			else if (event instanceof Speech.ListeningStartedEvent) {
				console.log("Listening");
			}

			else if (event instanceof Speech.RecognitionStartedEvent) {
				console.log("Recognizing");
			}

			else if (event instanceof Speech.SpeechStartDetectedEvent) {
				console.log("Speech started");
			}

			else if (event instanceof Speech.SpeechHypothesisEvent) {
				if (event.Result.Text) {
					this.lastText = event.Result.Text;
					this.lastOffset = event.Result.Offset;
					this.lastDuration = event.Result.Duration;
					console.log('Offset: ' + this.lastOffset + ' Duration: ' + this.lastDuration);
					this._onText.fire(event.Result.Text);
				}
			}

			else if (event instanceof Speech.SpeechSimplePhraseEvent) {
				//This event fires when result type is set to simple
				console.log('SimplePhraseEvent');
				console.log(JSON.stringify(event.Result)); 
				if (event.Result.DisplayText) {
					this._onText.fire(event.Result.DisplayText);
					this.lastText = event.Result.DisplayText;
					this.lastOffset = event.Result.Offset;
					this.lastDuration = event.Result.Duration;
					let speechPausedResult = new SpeechPausedResult(this.lastText, this.lastOffset, this.lastDuration);
					//this._onSpeechPaused.fire(this.lastText);
					this._onSpeechPaused.fire(speechPausedResult);
				}
			}

			else if (event instanceof Speech.SpeechDetailedPhraseEvent) {
			}

			else if (event instanceof Speech.SpeechEndDetectedEvent) {
				console.log('SpeechEndDetectedEvent');
				console.log(JSON.stringify(event.Result));
				let speechPausedResult = new SpeechPausedResult(this.lastText, this.lastOffset, this.lastDuration);
				//this._onSpeechPaused.fire(this.lastText);
				this._onSpeechPaused.fire(speechPausedResult);
			}

			else if (event instanceof Speech.RecognitionEndedEvent) {
				console.log('SpeechRecognitionEndedEvent');
				console.log(JSON.stringify(event.Result));
				this._onText.fire('');
				this.lastText = "";
				this.start();
			}

		})
			.On(() => {
			},
			(error) => {
				console.error(error);
			});
	}

}