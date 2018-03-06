import React from 'react';
import ReactDOM from 'react-dom';
import Home from './Components/Home/home';
import {Route, NavLink, HashRouter} from 'react-router-dom';
import Interview from './Components/Interview/Interview';
import CreateSession from './Components/CreateSession/CreateSession';
import Interviewee from './Components/Interviewee/Interviewee';
import AwaitInterviewee from './Components/AwaitInterviewee/AwaitInterviewee';

let socket: WebSocket;

async function initializeSocketForInterviewer(interviewerName: string): Promise<string> {
  console.log('Initializing socket for interviewer');

  const establishSocketAndWaitForUrl = new Promise<string>(resolve => {
    socket = new WebSocket(`ws://localhost:3000/createSession?interviewerName=${interviewerName}`);
    socket.onmessage = (msg) => {
      console.log('Received URL', msg);
      const data = JSON.parse(msg.data);
      return resolve(data.urlForInterviewee);
    }
  });

  return await establishSocketAndWaitForUrl;
}

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <div>
          <h1>Better Customer Conversations</h1>
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/createSession">Create session</NavLink></li>
            <li><NavLink to="/interviewee">Interviewee page</NavLink></li>
            <li><NavLink to="/transcript">Transcript page</NavLink></li>
          </ul>
          <div className="content">
            <Route path="/" component={Home} />
            <Route path="/createSession" render={(props) => (
              <CreateSession {...props} initializeSocket={initializeSocketForInterviewer} />
            )} />
            <Route path="/interview" render={(props) => (
              <Interview {...props} interviewerSocket={socket} />
            )} />
            <Route path="/interviewee" component={Interviewee} />
            <Route path="/awaitInterviewee" render={(props) => (
              <AwaitInterviewee {...props} urlForInterviewee={""} name={""} socket={socket} />
            )} />
          </div>
        </div>
      </HashRouter>
    );
  }
}

export default App;

ReactDOM.render(<App />, document.getElementById('root'));