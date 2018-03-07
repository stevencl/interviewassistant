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

  copyUrlToClipboard = (e) => {
    var textArea = document.createElement("textarea");

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //
  
    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
  
    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';
  
    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = '0';
  
    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
  
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';
  
  
    textArea.value = this.props["location"]["state"].urlForInterviewee;
  
    document.body.appendChild(textArea);
  
    textArea.select();
  
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      console.log('Copying text command was ' + msg);
    } catch (err) {
      console.log('Oops, unable to copy');
    }
  
    document.body.removeChild(textArea);
  }

  render() {
    return <div className="await-interviewee">      
      <Profile name={ this.props["location"]["state"].name } speaker="interviewer" />

      <p className="await-interviewee__instructions">To get started, send your participant the following link: </p>

      <p className="await-interviewee__link">
        { this.props["location"]["state"].urlForInterviewee }
      </p>

      <button onClick={this.copyUrlToClipboard} className="await-interviewee_copy">
        Copy
      </button>

      <p className="await-interviewee_instructions--additional">
        Once the participant opens the link in their browser, the session will start and your responses will be analyzed.
      </p>

    </div>
  };
}
  
