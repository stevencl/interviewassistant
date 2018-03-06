import React from 'react';
import ReactDOM from 'react-dom';

export type AwaitIntervieweeProps = {
    urlForInterviewee: string;
    socket: WebSocket;
    name: string;
};

export default class AwaitInterviewee extends React.Component<AwaitIntervieweeProps, any> {
  constructor(props) {
    super(props);
    console.log(props);

    this.props.socket.onmessage = (msg) => {
        console.log('Received message', msg);
        const data = JSON.parse(msg.data);
        const sessionData = data["sessionData"];
        if (sessionData) {
            this.props["history"].push({
                pathname: "/Interview",
                state: {
                    interviewerName: sessionData.interviewerName,
                    intervieweeName: sessionData.intervieweeName
                }
            });
        }
    }
  }

  render() {
    return <div>      
      This is the awaiting interviewee Component
      <div>
        { this.props["location"]["state"].urlForInterviewee }
      </div>
      <div>
        { this.props["location"]["state"].name }
      </div>
    </div>
  };
}
  
