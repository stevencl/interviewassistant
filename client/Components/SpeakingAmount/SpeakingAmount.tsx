import React from 'react';
import ReactDOM from 'react-dom';

export default function SpeakingAmount(props: { interviewerSpeakingAmount: number }) {
    return (
        <div className="speaking-amount">
            <div className="speaking-amount__value" style={ {width: props.interviewerSpeakingAmount + "%" } }></div>
        </div>
    );
}
