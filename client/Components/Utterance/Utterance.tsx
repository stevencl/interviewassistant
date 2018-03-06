import React from 'react';
import ReactDOM from 'react-dom';
import * as Messages from '../../lib/Common/Messages';

export type UtteranceProps = {
    utteranceKey: string;
    getUtteranceByKey: (key: string) => Messages.IUtteranceContent;
};

type UtteranceState = {
    utterance: Messages.IUtteranceContent;
}

export default class Utterance extends React.Component<UtteranceProps, UtteranceState> {
    constructor(props) {
        super(props);

        this.state = {
            utterance: this.props.getUtteranceByKey(this.props.utteranceKey)
        };
    }

    shouldComponentUpdate(nextProps, nextState): boolean {
        console.log('Seeing if utterance component should update');
        const nextUtterance = this.props.getUtteranceByKey(nextProps.utteranceKey);
        console.log('The current utterance is: ', this.state.utterance);
        console.log('The next utterance is :', nextUtterance);

        // TODO, check if LUIS information has been added

        return false;
    }

    componentWillUnmount() {
    }

    render() {
        return (
            <div className={`utterance ${this.state.utterance.speaker === "interviewer" ? "utterance--interviewer" : "utterance--interviewee"}`}>
              <p>{this.state.utterance.text}</p>
              {/* { this.state.utterance.luisResponse ?
                  <div className="utterance__suggestion-container">
                    <p className="utterance__suggestion-title">Suggestion</p>
                    {this.state.utterance.luisResponse.suggestions.map(suggestion => {
                        <p className="utterance__suggestion">{suggestion}</p>
                    })}
                  </div> :
                  null
              }} */}
            </div>
        )
    }
}