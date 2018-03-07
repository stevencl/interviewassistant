import React from 'react';
import ReactDOM from 'react-dom';
import * as Messages from '../../lib/Common/Messages';
import Profile from '../Profile/Profile';

export type AwaitIntervieweeProps = {
    socket: WebSocket;
};

export default class AwaitInterviewee extends React.Component<AwaitIntervieweeProps, any> {
  constructor(props) {
    super(props);
    console.log(props);

    this.props.socket.onmessage = (msg) => {
        console.log('Received message', msg);
        const message: Messages.IMessageData = JSON.parse(msg.data);
        if (message.messageType === Messages.INTERVIEWEE_JOINED_TYPE) {
          const messageContent: Messages.IIntervieweeJoinedContent = message.content;
          if (messageContent) {
              this.props["history"].push({
                  pathname: "/Interview",
                  state: {
                      interviewerName: messageContent.interviewerName,
                      intervieweeName: messageContent.intervieweeName
                  }
              });
          }
        } else {
          console.log('Didnt get the expected interviewee joined message');
        }
    }
  }

  render() {
    return <div className="await-interviewee">      
      <Profile name={ this.props["location"]["state"].name } speaker="interviewer" />

      <p className="await-interviewee__instructions">To get started, send your participant the following link: </p>

      <p className="await-interviewee__link">
        { this.props["location"]["state"].urlForInterviewee }
      </p>

      <button className="await-interviewee_copy">
        Copy
      </button>

      <p className="await-interviewee_instructions--additional">
        Once the participant opens the link in their browser, the session will start and your responses will be analyzed.
      </p>

    </div>
  };
}
  
