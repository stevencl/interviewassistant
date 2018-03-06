import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../../lib/speechToText/util';
import { Microphone } from '../../lib/Audio/audio';
import { SpeechToTextService, SpeechPausedResult } from '../../lib/speechToText/speechService';
import Conversation from '../Conversation/Conversation';

declare const RecordRTC;
declare const StereoAudioRecorder;
 
export type InterviewProps = {
    interviewerSocket: WebSocket;
};

type InterviewState = {
  interviewID: string;
  name: string;
}

export default class Interview extends React.Component<InterviewProps, InterviewState> {
  private microphone: Microphone;
  private recorder: any;

  constructor(props) {
    super(props);

    this.state = {
      name: '',
      interviewID: '',
    };

    console.log('Starting microphone...');
    const mic = new Microphone();

    mic.onReady(() => {
      console.log('Microphone ready');
      this.microphone = mic;

      this.initializeSpeechToText();
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

          // this.setState({ subtitles: text });
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
          // this.setState({ utterances: [...this.state.utterances, { name: this.state.name, text: tempText, duration: durationSpeech, startTime: 'sometime' }]});
          // Send text to server
          this.props.interviewerSocket.send(JSON.stringify({ name: this.state.name, duration: durationSpeech, text: transcript, startTime: startTimeText}));
        }
      });

      startTime = new Date().getTime();
      this.recorder.startRecording();
    });

    // socket.onmessage = (e) => {
    //   const data = JSON.parse(e.data);
    //   console.log(data);
    //   if(data.messageType === 'transcript'){
    //     this.setState({ utterances: [...this.state.utterances, { name: data.name, text: data.text, duration: data.duration, startTime: data.startTime }]});
    //   } else if(data.messageType === 'LUIS'){
    //     console.log(data.message);
    //   }
    // }
  }

  render() {
    return (
      <div>      
        This is the interview component
        {/* <Subtitles label={this.state.subtitles} /> */}
        <Conversation />      
      </div>
    )
  };
}
  
