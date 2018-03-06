import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../../lib/speechToText/util';
import { Microphone } from '../../lib/Audio/audio';
import { SpeechToTextService, SpeechPausedResult } from '../../lib/speechToText/speechService';
import { initializeSpeechToText, startRecording } from '../../lib/speechToText/speechCommon';
import Conversation from '../Conversation/Conversation';
import * as Messages from '../../lib/Common/Messages';
 
export type InterviewProps = {
    interviewerSocket: WebSocket;
};

type InterviewState = {
  utterances: Messages.IUtteranceContent[];
}

export default class Interview extends React.Component<InterviewProps, InterviewState> {
  private microphone: Microphone;
  private recorder: any = null;

  constructor(props) {
    super(props);

    this.state = {
      utterances: []
    };

    const mic = new Microphone();

    mic.onReady(() => {
      console.log('Microphone ready');
      this.microphone = mic;

      this.initializeSpeechToText();

      // Handle messages from the interviewee
      this.props.interviewerSocket.onmessage = (msg) => {
        console.log('Received message', msg);
        const message: Messages.IMessageData = JSON.parse(msg.data);
        if (message.messageType === Messages.UTTERANCE_TYPE) {
          const messageContent: Messages.IUtteranceContent = message.content;
          if (messageContent) {
              this.setState({
                utterances: [...this.state.utterances, messageContent]
              });
          }
        } else {
          console.log('Didnt get the expected utterance message');
        }
      }
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
    speechToTextService.onText(text => {
      // this.setState({ subtitles: text });
    });

    startRecording(this.recorder, this.microphone, speechToTextService.onSpeechPaused, this.handleTranscript);
  }

  private handleTranscript = (transcript: string, startTimeText: string, endTimeText: string, duration: number) => {
    const utterance: Messages.IUtteranceContent =  {
      speaker: "interviewer",
      duration: duration,
      text: transcript,
      startTime: startTimeText
    };

    this.props.interviewerSocket.send(JSON.stringify(
      { 
        messageType: Messages.UTTERANCE_TYPE,
        content: utterance
      } as Messages.IMessageData
    ));

    this.setState({ 
      utterances: [...this.state.utterances, utterance]
    });
  }

  render() {
    return (
      <div>      
        This is the interview component
        {/* <Subtitles label={this.state.subtitles} /> */}
        <Conversation utterances={this.state.utterances} />      
      </div>
    )
  };
}
  
