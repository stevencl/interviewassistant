import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../../lib/speechToText/util';
import { Microphone } from '../../lib/Audio/audio';
import { SpeechToTextService, SpeechPausedResult } from '../../lib/speechToText/speechService';
import { initializeSpeechToText, startRecording } from '../../lib/speechToText/speechCommon';
import Conversation from '../Conversation/Conversation';
import SpeakingAmount from '../SpeakingAmount/SpeakingAmount';
import ConversationDashboard from '../ConversationDashboard/ConversationDashboard';
import * as Messages from '../../lib/Common/Messages';
 
export type InterviewProps = {
    interviewerSocket: WebSocket;
};

type InterviewState = {
  // A list of all the utterance keys in the order received, to be rendered
  utteranceKeys: string[];
  interviewerSpeakingPercent: number;
}

export default class Interview extends React.Component<InterviewProps, InterviewState> {
  private microphone: Microphone;
  private recorder: any = null;
  // Dictionary of utterances by their key (speaker:startTimestamp), for fast lookups
  private utterancesByKey: { [key: string]: Messages.IUtteranceContent } = {};
  private interviewerWords: number = 0;
  private intervieweeWords: number = 0;
  private conversationDashboardComponent: ConversationDashboard;
  private dummyMessagesEnd: HTMLDivElement;

  constructor(props) {
    super(props);

    this.state = {
      utteranceKeys: [],
      interviewerSpeakingPercent: 50
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
              this.utterancesByKey[messageContent.key] = messageContent;
              const wordsInUtterance = messageContent.text.split(' ').length;

              if (messageContent.speaker === "interviewer") {
                this.interviewerWords += wordsInUtterance;
              } else {
                this.intervieweeWords += wordsInUtterance;
              }

              this.setState({
                utteranceKeys: [...this.state.utteranceKeys, messageContent.key],
                interviewerSpeakingPercent: Math.round(this.interviewerWords * 100 / (this.interviewerWords + this.intervieweeWords))
              });
          }
        } else if (message.messageType === Messages.LUIS_TYPE) {
          const messageContent: Messages.IUtteranceContent = message.content;
          if (messageContent && messageContent.key && this.utterancesByKey[messageContent.key]) {
            this.utterancesByKey[messageContent.key] = messageContent;
          }
          // Force rerender of the updated element
          this.setState(this.state);
        } else {
          console.log('Didnt get the expected utterance message');
        }
      }
    });
  }

  componentDidMount() {
    this.conversationDashboardComponent.timer.startTimer();
  }

  componentDidUpdate() {
    this.dummyMessagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  componentWillUnmount() {
    console.log('Stopping microphone...');
    if (this.microphone) {
      this.microphone.stop();
    }
    
    if (this.recorder) {
      this.recorder.stopRecording();
    }

    if (this.conversationDashboardComponent && this.conversationDashboardComponent.timer) {
      this.conversationDashboardComponent.timer.stopTimer();
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

  // Callback given to startRecording to do something after the transcription is generated for an speech utterance
  private handleTranscript = (transcript: string, startTimeText: string, endTimeText: string, duration: number) => {
    const utterance: Messages.IUtteranceContent =  {
      key: `interviewer:${startTimeText}`,
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
  }

  // Method to get a specific utterance by its key, passed down so that the Utterance component can know whether it needs
  // to update itself (based on analysis data from the server)
  private getUtteranceByKey = (key: string): Messages.IUtteranceContent => {
    return this.utterancesByKey[key];
  }

  render() {
    return (
      <div className="interview">      
        <ConversationDashboard ref={ instance => { this.conversationDashboardComponent = instance }} interviewerName={ this.props["location"]["state"].interviewerName } intervieweeName="John" />
        <SpeakingAmount interviewerSpeakingAmount={this.state.interviewerSpeakingPercent} />
        <Conversation utteranceKeys={this.state.utteranceKeys} getUtteranceByKey={this.getUtteranceByKey} />      
        <div style={{ float: "left", clear: "both" }}
             ref={(el) => { this.dummyMessagesEnd = el; }}>
        </div>
      </div>
    )
  };
}
  
