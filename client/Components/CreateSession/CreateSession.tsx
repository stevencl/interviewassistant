import React from 'react';
import * as Messages from '../../lib/Common/Messages';

type InterviewerStartFormProps = {
    initializeSocket: (interviewerName: string) => WebSocket;
}

interface InterviewerStartFormState {
    name: string;
}

export default class CreateSession extends React.Component<InterviewerStartFormProps, InterviewerStartFormState> {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
    }

    async handleSubmit(event) {
      event.preventDefault();
      const socket = this.props.initializeSocket(this.state.name);

      const waitForUrl = new Promise<string>(resolve => {
        socket.onmessage = (msg) => {
          console.log('Received URL', msg);
          const message: Messages.IMessageData = JSON.parse(msg.data);
          if (message.messageType === Messages.URL_FOR_INTERVIEWEE_TYPE) {
            const messageContent: Messages.IUrlForIntervieweeContent = message.content;
            if (messageContent) {
                return resolve(messageContent.urlForInterviewee);
            }
          } else {
            console.log('Didnt get the expected url for interviewee message');
          }
        }
      });
    
      const urlForInterviewee = await waitForUrl;

      this.props["history"].push({
        pathname: "/awaitInterviewee",
        state: {
            urlForInterviewee: urlForInterviewee,
            name: this.state.name
        }
      });
    }

    render() {
      return (
        <form className="create-session" onSubmit={this.handleSubmit}>
            <div >
            <label htmlFor="name">
                Name:
            </label>
            <input placeholder="Interviewer name" name="name" type="text" value={this.state.name} onChange={this.handleChange} />
          </div>
          <input className="create-session__button" type="submit" value="Create Interview Session" />
        </form>
      );
    }
}
