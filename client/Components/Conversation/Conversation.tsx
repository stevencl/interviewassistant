import React from 'react';
import ReactDOM from 'react-dom';

export type ConversationProps = {
    // interviewerMessages: string[];    
    // intervieweeMessages: string[];
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
    return <div>      
        This is the conversation component
    </div>
  };
}
  
