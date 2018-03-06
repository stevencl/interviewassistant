import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../../lib/speechToText/util';
import { Microphone } from '../../lib/Audio/audio';
import { SpeechToTextService, SpeechPausedResult } from '../../lib/speechToText/speechService';
import { initializeSpeechToText, startRecording } from '../../lib/speechToText/speechCommon';
import queryString from 'query-string';
import * as Messages from '../../lib/Common/Messages';

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
  private recorder: any = null;
  private socket: WebSocket;

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
    if (this.microphone) {
      this.microphone.stop();
    }
    
    if (this.recorder) {
      this.recorder.stopRecording();
    }
  }

  private async initializeSpeechToText() {
    const speechToTextService: SpeechToTextService = await initializeSpeechToText();
    speechToTextService.start();

    startRecording(this.recorder, this.microphone, speechToTextService.onSpeechPaused, this.handleTranscript);
  }

  private handleTranscript = (transcript: string, startTimeText: string, endTimeText: string, duration: number) => {
    console.log('Interviewee said: ', transcript);
    const utterance: Messages.IUtteranceContent =  {
      speaker: "interviewee",
      duration: duration,
      text: transcript,
      startTime: startTimeText
    };

    this.socket.send(JSON.stringify(
      { 
        messageType: Messages.UTTERANCE_TYPE,
        content: utterance
      } as Messages.IMessageData
    ));
  }

  private initializeSocket() {
      console.log('Attempting to join existing session as interviewee');
      const params = queryString.parse(this.props["location"]["search"]);
      const sessionId = params["sessionId"];
      if (!sessionId) {
          console.error('Couldnt get session ID from URL');
          return;
      }

      this.socket = new WebSocket(`ws://localhost:3000/?sessionId=${sessionId}`);
      this.socket.addEventListener('open', (e) => {
          console.log('Interviewee Websocket is open');
      });
  }

  render() {
    return <div>      
      This is the interviewee component
    </div>
  };
}
  
