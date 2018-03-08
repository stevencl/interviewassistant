import React from 'react';
import ReactDOM from 'react-dom';
import Home from './Components/Home/home';
import {Route, NavLink, HashRouter} from 'react-router-dom';
import Interview from './Components/Interview/Interview';
import CreateSession from './Components/CreateSession/CreateSession';
import Interviewee from './Components/Interviewee/Interviewee';
import AwaitInterviewee from './Components/AwaitInterviewee/AwaitInterviewee';

let socket: WebSocket;

function initializeSocketForInterviewer(interviewerName: string): WebSocket {
  console.log('Initializing socket for interviewer');
  socket = new WebSocket(`wss://${window.location.host}/createSession?interviewerName=${interviewerName}`);
  return socket;
}

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <div>
          <header role="banner" className="nav-bar">
            <a href="https://www.microsoft.com" className="logo">
              <img src="images/ms-small.png" />
            </a>

            <nav className="nav-bar__links">
              <ul>
                <li><NavLink to="/">Home</NavLink></li>
                <li><NavLink to="/createSession">Create session</NavLink></li>
                <li><NavLink to="/transcript">Transcript page</NavLink></li>
              </ul>
            </nav>
          </header>

          <div className="content">
            <Route exact path="/" component={Home} />
            <Route path="/createSession" render={(props) => (
              <CreateSession {...props} initializeSocket={initializeSocketForInterviewer} />
            )} />
            <Route path="/interview" render={(props) => (
              <Interview {...props} interviewerSocket={socket} />
            )} />
            <Route path="/interviewee" component={Interviewee} />
            <Route path="/awaitInterviewee" render={(props) => (
              <AwaitInterviewee {...props} socket={socket} />
            )} />
          </div>
        </div>
      </HashRouter>
    );
  }
}

export default App;

ReactDOM.render(<App />, document.getElementById('root'));