import React from 'react';
import ReactDOM from 'react-dom';
import * as Messages from '../../lib/Common/Messages';

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
  
