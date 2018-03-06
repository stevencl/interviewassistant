import React from 'react';

export interface utterance {
    name: string,
    text: string;
    duration: number;
    startTime: string;
}

export default function Transcript(props: { utterances: utterance[] }) {
    return <div className="container">
        <table className="table">
            <colgroup>
                <col span={1} style={{ width: '20%' }} />
                <col span={1} style={{ width: '50%' }} />
                <col span={1} style={{ width: '25%' }} />
                <col span={1} style={{ width: '5%' }} />
            </colgroup>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Sentence</th>
                    <th>Duration</th>
                    <th>Column</th>
                </tr>
            </thead>
            <tbody>
                {
                    props.utterances.map(u => {
                        <tr>
                            <td>{u.name}</td>
                            <td>{u.text}</td>
                            <td>{u.duration.toLocaleString()}</td>
                            <td>{this.state.interviewID}</td>
                        </tr>
                    })
                }
            </tbody>
        </table>
    </div>
}