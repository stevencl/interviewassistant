import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from './util';
import { Microphone } from './audio';
import { SpeechToTextService, SpeechPausedResult } from './speechService';

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

interface utterance {
  text: string;
  duration: number;
  startTime: string;
  //Does an utterance need to have a response? Is this the best place to put any response that comes back from luis
}

declare const RecordRTC;
declare const StereoAudioRecorder;
declare const moment;

type SpectrumAnalyzerProps = {
  microphone: Microphone,
  width: number,
  height: number
};

type StudyDetailsFormProps = {
  onStartStudy: () => void,
  callback: (name: string, interviewID: string) => void
}

class StudyDetailsForm extends React.Component<StudyDetailsFormProps> {
  constructor(props) {
    super(props);
    this.state = {name: '',
                  interviewID: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
      this.setState({[event.target.name]: event.target.value});
  }

  handleSubmit(event) {
    //Call a method from the main app which will start the recorder:
    this.props.callback(this.state.name, this.state.interviewID);
    this.props.onStartStudy();
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
        <input className="flex-item" type="submit" value="Start interview" />
      </form>
    );
  }
}

class SpectrumAnalyzer extends React.Component<SpectrumAnalyzerProps> {

  private animationFrameRequest: number;

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 100, 100);

    const draw = () => {
      this.animationFrameRequest = requestAnimationFrame(draw);
      this.paint();
    };

    draw();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrameRequest);
  }

  paint() {
    const frequencyData = this.props.microphone.getFloatFrequencyData();
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(250,250,250)';
    ctx.fillRect(0, 0, this.props.width, this.props.height);

    ctx.beginPath();

    // ctx.lineWidth = 5;
    // ctx.strokeStyle = 'rgba(128, 0, 0, 0.1)';
    ctx.fillStyle = 'rgb(240,240,240)';

    ctx.moveTo(this.props.width, this.props.height);
    ctx.lineTo(0, this.props.height);

    const barWidth = (this.props.width / frequencyData.length) * 2.5;
    let x = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const value = Math.max(frequencyData[i] + 120, 20) - 20;
      const barHeight = value * this.props.height / 140;
      const y = this.props.height - barHeight;

      ctx.lineTo(x, y);
      x += barWidth + 1;
    }

    ctx.lineTo(this.props.width, this.props.height);
    // ctx.stroke();
    ctx.fill();
  }

  render() {
    return <canvas ref="canvas" width={this.props.width} height={this.props.height}></canvas>;
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

type AppProps = {
  microphone: Microphone;
};

type AppState = {
  text: string;
  leadingQuestion: string,
  utterances: utterance[];
  subtitles: string,
  width: number,
  height: number,
  name: string,
  interviewID: string
};

class App extends React.Component<AppProps, AppState> {

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
      interviewID: ''
    };

    this.studyDetailsCallback = this.studyDetailsCallback.bind(this);
  }

  studyDetailsCallback(name: string, interviewID: string) {
    this.setState({...this.state, name: name, interviewID: interviewID});
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
    const socket = new WebSocket('ws://localhost:8080/interviewer');
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
        var newUtterances = this.state.utterances.slice();
        if (result.text != "") {
          let tempText = result.text;
          newUtterances.push({ text: tempText, duration: durationSpeech, startTime: 'sometime' });
          this.setState({ utterances: [...this.state.utterances, { text: tempText, duration: durationSpeech, startTime: 'sometime' }]});
          socket.send(JSON.stringify({ durationSpeech, tempText, startTimeText }));
        }
      });

      startTime = new Date().getTime();
      recorder.startRecording();
    });

    socket.onmessage = (e) => {
      const text = JSON.parse(e.data);
      //Currently leading question response is placed over the subtitle
      //Can we set the app up so that the leading question response is attached to the last utterance and is displayed underneath?
      //Or set up another app state, responses. The 
      let lastUtterance = this.state.utterances.pop(); //Does this change the state? I don't think so

      console.log("Received a response - " + lastUtterance);
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

  render() {
    const utterances = this.state.utterances;

    return <div>
      <SpectrumAnalyzer width={this.state.width} height={this.state.height} microphone={this.props.microphone} />
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
      <StudyDetailsForm onStartStudy={() => this.startTheRecording()} callback={this.studyDetailsCallback}/>
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
                        {this.state.name}
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
    </div>;
  }
}

const mic = new Microphone();
mic.onReady(() => ReactDOM.render(<App microphone={mic} />, document.body));
