import React from 'react';
import ReactDOM from 'react-dom';

export default function Profile(props: { name: string, speaker: "interviewer" | "interviewee" }) {
    return (
        <div className="profile">
            <div className="profile__name">{ props.name }</div>
            <div className="profile__photo-frame">
                <img src={ props.speaker === "interviewer" ? "images/interviewer.jpg" : "images/interviewee.jpg" }/>
            </div>
        </div>
    );
}
