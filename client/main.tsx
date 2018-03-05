import React from 'react';
import ReactDOM from 'react-dom';
import Home from './Components/Home/home';
import {Route, NavLink, HashRouter} from 'react-router-dom';
import { Interviewer } from './Components/Interviewer/interviewer'

export type AppProps = {
};

export type AppState = {
  text: string;
  leadingQuestion: string,
  //utterances: utterance[];
  subtitles: string,
  width: number,
  height: number,
  name: string,
  interviewID: string,
  interviewer: boolean
};

class App extends React.Component {

  render() {
    return (
      <HashRouter>
        <div>
          <h1>Better Customer Conversations</h1>
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/interviewer">Interviewer page</NavLink></li>
            <li><NavLink to="/interviewee">Interviewee page</NavLink></li>
            <li><NavLink to="/transcripts">Transcript page</NavLink></li>
          </ul>
          <div className="content" >
            <Route path="/" component={Home} />
            <Route path="/interviewer" component={Interviewer} />
          </div>
        </div>
      </HashRouter>
    );
  }
}

export default App;

ReactDOM.render(<App />, document.getElementById('root'));