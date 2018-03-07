import React from 'react';
import ReactDOM from 'react-dom';
import * as Messages from '../../lib/Common/Messages';
import Utterance from '../Utterance/Utterance';

export type ConversationProps = {
    utteranceKeys: string[];
    getUtteranceByKey: (key: string) => Messages.IUtteranceContent;
};

type ConversationState = {
}

export default class Conversation extends React.Component<ConversationProps, ConversationState> {

  constructor(props) {
    super(props);
  }

  render() {
    return <div className="conversation">      
        {this.props.utteranceKeys.map(key => {
          return <Utterance key={key} utteranceKey={key} getUtteranceByKey={this.props.getUtteranceByKey} />
        })}
    </div>
  };
}
  
