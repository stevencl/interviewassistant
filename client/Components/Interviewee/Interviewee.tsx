import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../../lib/speechToText/util';
import { Microphone } from '../../lib/Audio/audio';
import { SpeechToTextService, SpeechPausedResult } from '../../lib/speechToText/speechService';
import queryString from 'query-string';

declare const RecordRTC;
declare const StereoAudioRecorder;
 
export type IntervieweeProps = {
    microphone: Microphone,
    socket: WebSocket;
};

type IntervieweeState = {
  name: string;
}

export default class Interviewee extends React.Component<IntervieweeProps, IntervieweeState> {
  private microphone: Microphone;
  private recorder: any;

  constructor(props) {
    super(props);

    this.state = {
      name: '',
    };

    console.log('Starting microphone...');
    const mic = new Microphone();

    mic.onReady(() => {
      console.log('Microphone ready');
      this.microphone = mic;

      this.initializeSpeechToText();
      this.initializeSocket();
    });
  }

  componentWillUnmount() {
    console.log('Stopping microphone...');
    this.microphone.stop();
    this.recorder.stopRecording();
  }

  private initializeSpeechToText() {
    fetch('/devenv.json')
      .then(response => response.json())
      .then(({ bsKey }) => {
        const speechService = new SpeechToTextService(bsKey);
        speechService.start();
        speechService.onText(text => {
        });

        this.startRecording(speechService.onSpeechPaused);
      });
  }

  private startRecording(onSpeechEnded: Event<SpeechPausedResult>) {
    this.recorder = RecordRTC(this.microphone.stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      numberOfAudioChannels: 2,
      desiredSampRate: 44100,
      disableLogs: true
    });

    let startTime = new Date().getTime();
    this.recorder.startRecording();

    onSpeechEnded(result => {
      const durationSpeech = (result.duration / 1000000000) * 100;

      this.recorder.stopRecording(() => {
        const startTimeText = startTime.toString();

        const endTimeText = new Date().getTime().toString();
        if (result.text != "") {
          const transcript = result.text;
          console.log('Interviewee said: ', transcript);
          // Send text to server
          this.props.socket.send(JSON.stringify({ name: this.state.name, duration: durationSpeech, text: transcript, startTime: startTimeText}));
        }
      });

      startTime = new Date().getTime();
      this.recorder.startRecording();
    });
  }

  private initializeSocket() {
      console.log('Attempting to join existing session as interviewee');
      const params = queryString.parse(this.props["location"]["search"]);
      const sessionId = params["sessionId"];
      if (!sessionId) {
          console.error('Couldnt get session ID from URL');
          return;
      }

      const socket = new WebSocket(`ws://localhost:3000/?sessionId=${sessionId}`);

      socket.addEventListener('open', (e) => {
          console.log('Interviewee Websocket is open');
      });
  }

  render() {
    return <div>      
      This is the interviewee component
    </div>
  };
}
  
