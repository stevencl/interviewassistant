import React from 'react';
import ReactDOM from 'react-dom';
import * as Messages from '../../lib/Common/Messages';

export type ConversationProps = {
    utterances: Messages.IUtteranceContent[];
};

type ConversationState = {
}

export default class Conversation extends React.Component<ConversationProps, ConversationState> {

  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
  }

  render() {
    return <div className="conversation">      
        This is the conversation component

        {this.props.utterances.map(utterance => {

          return (
            <div className={`utterance ${utterance.speaker === "interviewer" ? "utterance--interviewer" : "utterance--interviewee"}`}>
              <p>{utterance.text}</p>
            </div>
          )
        })}
    </div>
  };
}
  
