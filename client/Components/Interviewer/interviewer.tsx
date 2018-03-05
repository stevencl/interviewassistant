import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../../lib/speechToText/util';
import { Microphone } from '../../lib/Audio/audio';
import { SpeechToTextService, SpeechPausedResult } from '../../lib/speechToText/speechService';
import { SpectrumAnalyzer, SpectrumAnalyzerProps} from '../SpectrumAnalyzer/spectrumAnalyzer'

declare const RecordRTC;
declare const StereoAudioRecorder;
declare const moment;

type InterviewerHandshakeFormProps = {
    onStartHandshake: () => void
}

type InterviewerStartFormProps = {
    onStartInterview: () => void,
    callback: (name: string, interviewID: string) => void
}

interface InterviewerStartFormState {
    name: string;
    interviewID: string;
}

interface Speaker {
    name: string;
    id: string;
    github: string;
}
  
interface SpeakerState {
    speaker: Speaker;
    time: number;
    lastphrase: string;
    keyphrases: string[];
}
  
export interface utterance {
    name: string,
    text: string;
    duration: number;
    startTime: string;
    //Does an utterance need to have a response? Is this the best place to put any response that comes back from luis
}
  
export class InterviewerHandshakeForm extends React.Component<InterviewerHandshakeFormProps> {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        //Call a method from the main app which will start the recorder:
        this.props.onStartHandshake();
        event.preventDefault();
    }

    render() {
        return (
        <form className="flex-container" onSubmit={this.handleSubmit}>
            <input className="flex-item" type="submit" value="Handshake" />
        </form>
        );
    }
}

export class InterviewerStartForm extends React.Component<InterviewerStartFormProps, InterviewerStartFormState> {
    constructor(props) {
        super(props);
        this.state = {name: '',
                    interviewID: ''};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    isNotEmpty(val){
        return (val === undefined || val == null || val.length <= 0) ? false : true;
    }

  handleChange(event) {
      this.setState({[event.target.name]: event.target.value});
  }

  handleSubmit(event) {
    //Call a method from the main app which will start the recorder:
    this.props.callback(this.state.name, this.state.interviewID);
    this.props.onStartInterview();
    event.preventDefault();
  }

  render() {
    return (
      <form className="flex-container" onSubmit={this.handleSubmit}>
      <div className="flex-item" >
        <label>
          Name:
          <input name="name" type="text" value={this.state.name} onChange={this.handleChange} />
        </label>
        </div>
        <div className="flex-item">
        <label>
          Interview ID:
          <input name ="interviewID" type="text" value={this.state.interviewID} onChange={this.handleChange} />
        </label>
        </div>
        <input className="flex-item" type="submit" value="Start Interview" />
      </form>
    );
  }
}

function Subtitles(props: { label: string }) {
    return <footer className="footer">
      <div className="container">
        <div className="content has-text-centered">
          <p>{props.label || '\u00A0'}</p>
        </div>
      </div>
    </footer>;
  }
  
function LeadingQuestion(props: { label: string }) {
    return <footer className="footer">
      <div className="container">
        <div className="content has-text-centered">
          <p>{props.label || '\u00A0'}</p>
        </div>
      </div>
    </footer>;
  }

export type InterviewerProps = {
  microphone: Microphone,
  width: number,
  height: number
};

type InterviewerState = {
  microphone: Microphone;
  interviewID: string;
  name: string;
  utterances: utterance[];
  subtitles: string;
}

export class Interviewer extends React.Component<InterviewerProps, InterviewerState> {

  constructor(props) {
    super(props);

    this.state = {
      utterances: [],
      subtitles: '',
      name: '',
      interviewID: '',
      microphone: null,
    };

    this.studyDetailsCallback = this.studyDetailsCallback.bind(this);

    console.log('Starting microphone...')    
    const mic = new Microphone();

    mic.onReady(() => {
      console.log('Microphone ready')
      this.setState({microphone: mic});
    });
    
  }

  isNotEmpty(val){
    return (val === undefined || val == null || val.length <= 0) ? false : true;
  }

  studyDetailsCallback(name: string, interviewID: string) {
    console.log("callback: " + name);
    if(this.isNotEmpty(name)){
      console.log(name);
      this.setState({name: name});
    }
    if(this.isNotEmpty(interviewID)){
      this.setState({interviewID: interviewID});
    }
  }

  componentDidMount() {
    // const updateState = () => {
    //   const { width, height } = document.body.getBoundingClientRect();
    //   this.setState({ width, height });
    // };

    // window.addEventListener('resize', updateState);
    // updateState();
  }

  componentWillUnmount() {
    console.log('Stopping microphone...')
    this.state.microphone.stop();
  }

  startTheRecording() {
    fetch('/devenv.json')
      .then(response => response.json())
      .then(({ bsKey }) => {
        const speechService = new SpeechToTextService(bsKey);
        speechService.start();
        speechService.onText(text => {

          this.setState({ ...this.state, subtitles: text });
        });

        this.startRecording(speechService.onSpeechPaused);
      });

    const start = new Date();
    setInterval(() => {
      const millis = new Date().getTime() - start.getTime();
      const duration = moment.duration(millis, 'ms');

      let allSecs = Math.floor(millis / 1000);
      let secs = allSecs % 60;
      let mins = Math.floor(allSecs / 60);

      let seconds, minutes;
      seconds = secs < 10 ? `0${secs}` : secs;
      minutes = mins < 10 ? `0${mins}` : mins;

      (this.refs.timer as HTMLElement).textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  private startRecording(onSpeechEnded: Event<SpeechPausedResult>) {
    const websocketName = 'ws://localhost:3000/?sessionId=' + this.state.interviewID;
    console.log('websocketname: ' + websocketName);
    const socket = new WebSocket(websocketName);
    const recorder = RecordRTC(this.props.microphone.stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      numberOfAudioChannels: 2,
      desiredSampRate: 24 * 1000,
      disableLogs: true
    });

    let startTime = new Date().getTime();
    recorder.startRecording();

    onSpeechEnded(result => {
      const durationSpeech = (result.duration / 1000000000) * 100;

      recorder.stopRecording(() => {
        const startTimeText = startTime.toString();

        const endTimeText = new Date().getTime().toString();
        if (result.text != "") {
          let tempText = result.text;
          this.setState({ utterances: [...this.state.utterances, { name: this.state.name, text: tempText, duration: durationSpeech, startTime: 'sometime' }]});
          console.log(this.state.name);
          socket.send(JSON.stringify({ name: this.state.name, duration: durationSpeech, text: tempText, startTime: startTimeText}));
        }
      });

      startTime = new Date().getTime();
      recorder.startRecording();
    });

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log(data);
      if(data.messageType === 'transcript'){
        this.setState({ utterances: [...this.state.utterances, { name: data.name, text: data.text, duration: data.duration, startTime: data.startTime }]});
      } else if(data.messageType === 'LUIS'){
        console.log(data.message);
      }
    }
  }

  private requestHandshake() {
    console.log("Creating session");
    const socket = new WebSocket('ws://localhost:3000/createSession');
    socket.onmessage = (e) => {
      console.log('received message');
      this.setState({...this.state, interviewID: e.data});
      console.log(this.state);
      console.log(e);
    }

    this.startTheRecording();
  }
  
  render() {
    const utterances = this.state.utterances;

    return <div>      
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">
              Interview assistant
              <span ref="timer" style={{ float: "right" }} ></span>
            </h1>
            <h2 className="subtitle">
              Helping you avoid leading questions
            </h2>
          </div>
        </div>
      </section>
      <section className="section">
      <InterviewerStartForm onStartInterview={() => this.requestHandshake()} callback={this.studyDetailsCallback}/>
      <InterviewerStartForm onStartInterview={() => this.startTheRecording()} callback={this.studyDetailsCallback}/>
      </section>

      <section className="section">
        <div className="container">
          <table className="table">
            <colgroup>
              <col span={1} style={{ width: '20%' }} />
              <col span={1} style={{ width: '50%' }} />
              <col span={1} style={{ width: '25%' }} />
              <col span={1} style={{ width: '5%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th>Sentence</th>
                <th>Duration</th>
                <th>Column</th>
              </tr>
            </thead>
            <tbody>
              {
                //Send
                utterances.map(u => {

                  return [
                    <tr>
                      <th>
                        {u.name}
                      </th>
                      <th>
                      {u.text}
                      </th>
                      <td>
                        {u.duration.toLocaleString()}
                      </td>
                      <td>{this.state.interviewID}</td>
                    </tr>
                  ];
                })
              }
            </tbody>
          </table>
        </div>
      </section>
      {/* <LeadingQuestion label={this.state.leadingQuestion} /> */}
      <Subtitles label={this.state.subtitles} />
    </div>
    };
}
  
