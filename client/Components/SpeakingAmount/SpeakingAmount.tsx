import React from 'react';
import ReactDOM from 'react-dom';

export default function SpeakingAmount(props: { interviewerSpeakingAmount: number }) {
    return (
        <div className="speaking-amount">
            The interviewer is speaking { props.interviewerSpeakingAmount.toString() }% of the time.
            The interviewee is speaking { (100-props.interviewerSpeakingAmount).toString() }% of the time.
        </div>
    );
}
