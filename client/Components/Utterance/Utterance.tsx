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
    private currentUtterance: Messages.IUtteranceContent;

    constructor(props) {
        super(props);
        
        this.currentUtterance = this.props.getUtteranceByKey(this.props.utteranceKey);
    }

    shouldComponentUpdate(nextProps, nextState): boolean {
        const nextUtterance = this.props.getUtteranceByKey(nextProps.utteranceKey);
        console.log('Current utterance is ', this.currentUtterance);
        console.log('Next utterance is ', nextUtterance);
        // TODO, check if LUIS information has been added
        if (!this.currentUtterance.luisResponse && nextUtterance.luisResponse) {
            console.log('COMPONENT SHOULD UPDATE');
            this.currentUtterance = nextUtterance;
            return true;
        }

        console.log('COMPONENT WONT UPDATE');

        return false;
    }

    componentWillUnmount() {
    }

    render() {
        const utterance = this.props.getUtteranceByKey(this.props.utteranceKey);
        return (            
            <div className={`utterance ${ utterance.speaker === "interviewer" ? "utterance--interviewer" : "utterance--interviewee"}`}>
              <p>{utterance.text}</p>
              { utterance.luisResponse ?
                  <div className="utterance__suggestion-container">
                    <p className="utterance__suggestion-title">Suggestion</p>
                    {Object.keys(utterance.luisResponse.suggestions).map(key => 
                        <p className="utterance__suggestion">
                        {utterance.luisResponse.suggestions[key]}</p>
                    )}
                  </div> :
                  null
              }
            </div>
        )
    }
}