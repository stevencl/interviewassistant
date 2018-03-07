import React from 'react';
import ReactDOM from 'react-dom';
import Profile from '../Profile/Profile';
import Timer from '../Timer/Timer';

export type ConversationDashboardProps = {
    interviewerName: string;
    intervieweeName: string;
};

type ConversationDashboardState = {
}

export default class ConversationDashboard extends React.Component<ConversationDashboardProps, ConversationDashboardState> {
    public timer: Timer;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    render() {
        return (
            <div className="conversation-dashboard">
                <Profile name={this.props.interviewerName} speaker="interviewer" />
                <Timer ref={ instance => { this.timer = instance}} />
                <Profile name={this.props.intervieweeName} speaker="interviewee" />
            </div>
        )
    }
}