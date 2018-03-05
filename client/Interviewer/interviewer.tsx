import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../util';
import { Microphone } from '../audio';
import { SpeechToTextService, SpeechPausedResult } from '../speechService';
import { AppState} from '../main';
import { SpectrumAnalyzer, SpectrumAnalyzerProps} from '../SpecturmAnalyzer/spectrumAnalyzer'

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

export class InterviewerStartForm extends React.Component<InterviewerStartFormProps> {
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

export class Interviewer extends React.Component<InterviewerProps> {

  constructor(props) {
    super(props);

    this.state = {
      text: 'Initial state',
      leadingQuestion: '',
      utterances: [],
      subtitles: '',
      width: 0,
      height: 0,
      name: '',
      interviewID: '',
      interviewer: false,
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
    console.log("hi" + this.state.name);
  }

  componentDidMount() {
    const updateState = () => {
      const { width, height } = document.body.getBoundingClientRect();
      this.setState({ width, height });
    };

    window.addEventListener('resize', updateState);
    updateState();

    // fetch('/devenv.json')
    //   .then(response => response.json())
    //   .then(({ bsKey }) => {
    //     const speechService = new SpeechToTextService(bsKey);
    //     speechService.start();
    //     speechService.onText(text => {
    //       this.setState({ ...this.state, subtitles: text });
    //     });

    //     this.startRecording(speechService.onSpeechPaused);
    //   });

    // const start = new Date();
    // setInterval(() => {
    //   const millis = new Date().getTime() - start.getTime();
    //   const duration = moment.duration(millis, 'ms');

    //   let allSecs = Math.floor(millis / 1000);
    //   let secs = allSecs % 60;
    //   let mins = Math.floor(allSecs / 60);

    //   let seconds, minutes;
    //   seconds = secs < 10 ? `0${secs}` : secs;
    //   minutes = mins < 10 ? `0${mins}` : mins;

    //   (this.refs.timer as HTMLElement).textContent = `${minutes}:${seconds}`;
    // }, 1000);
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
    console.log(this.state);
    // TODO: Kelley, figure out how to get this URL param working
    // It's current logging this:
    // websocketname: ws://localhost:3000/a3f868b5-788f-419c-9619-1cf235b54504
    // Which means it's trying to make the ID into a route, not a URL param??
    var websocketName = 'ws://localhost:3000/?sessionId=' + this.state.interviewID + '&interviewer=' + this.state.interviewer;
    // if(interviewID == null){
    //   websocketName = 'ws://localhost:3000/' + this.state.interviewID;
    // } else{
    //   websocketName = 'ws://localhost:3000/' + interviewID;
    // }
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
      const durationSpeech = (result.duration / 1000000000) * 100; //duration is in

      recorder.stopRecording(() => {
        const startTimeText = startTime.toString();

        const endTimeText = new Date().getTime().toString();
        if (result.text != "") {
          let tempText = result.text;
          this.setState({ utterances: [...this.state.utterances, { name: this.state.name, text: tempText, duration: durationSpeech, startTime: 'sometime' }]});
          console.log(this.state.name);
          socket.send(JSON.stringify({ name: this.state.name, duration: durationSpeech, text: tempText, startTime: startTimeText, interviewer: this.state.interviewer}));
        }
      });

      startTime = new Date().getTime();
      recorder.startRecording();
    });

    socket.onmessage = (e) => {
      //const text = JSON.parse(e.data);
      console.log("MESSAGE RECEIVED: " + this.state.interviewer);
      var data = JSON.parse(e.data);
      console.log(data);
      if(this.state.interviewer && data.messageType === 'transcript'){
        this.setState({ utterances: [...this.state.utterances, { name: data.name, text: data.text, duration: data.duration, startTime: data.startTime }]});
      } else if(data.messageType === 'LUIS'){
        console.log(data.message);
      }
      //Currently leading question response is placed over the subtitle
      //Can we set the app up so that the leading question response is attached to the last utterance and is displayed underneath?
      //Or set up another app state, responses. The
      //let lastUtterance = this.state.utterances.pop(); //Does this change the state? I don't think so

      //console.log("Received a response - " + lastUtterance);
      //lastUtterance.response = text;
      //this.setState({...this.state.})
      //this.setState({ ...this.state, leadingQuestion: text });

      // A better option would be as you mentioned:
      // var arrayvar = this.state.arrayvar.slice()
      // arrayvar.push(newelement)
      // this.setState({ arrayvar: arrayvar })
      // The memory "waste" is not an issue compared to the errors you might face using non-standard state modifications.
      // Alternative syntax
      // You can use concat to get a cleaner syntax since it returns a new array:
      // this.setState({
      //   arrayvar: this.state.arrayvar.concat([newelement])
      // })
      // In ES6 you can use the Spread Operator:
      // this.setState({
      //   arrayvar: [...this.state.arrayvar, newelement]
      // })



    }
  }

  private requestHandshake() {
    console.log("Creating session");
    const socket = new WebSocket('ws://localhost:3000/createSession');
    socket.onmessage = (e) => {
      console.log('received message');
      this.setState({...this.state, interviewID: e.data, interviewer: true});
      console.log(this.state);
      console.log(e);
    }
    this.startTheRecording();
  }
  
  //<SpectrumAnalyzer width={this.state.width} height={this.state.height} microphone={this.microphone} />
  render() {
    const utterances = this.state.utterances;

    return <div>      
    <SpectrumAnalyzer microphone={this.state.microphone} width={this.props.width} height={this.props.height} />
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
      <LeadingQuestion label={this.state.leadingQuestion} />
      <Subtitles label={this.state.subtitles} />
    </div>
    };
}
  
