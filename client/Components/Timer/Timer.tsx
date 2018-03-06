import React from 'react';
import ReactDOM from 'react-dom';

declare const moment;

export class Timer extends React.Component<any, any> {
    private timerInterval: NodeJS.Timer;

    startTimer() {
        const start = new Date();
        setInterval(() => {
          const millis = new Date().getTime() - start.getTime();
          const duration = moment.duration(millis, 'ms');
    
          let allSecs = Math.floor(millis / 1000);
          let secs = allSecs % 60;
          let mins = Math.floor(allSecs / 60);
    
          let seconds, minutes;
          seconds = secs < 10 ? `0${secs}` : secs;
          minutes = mins < 10 ? `0${mins}` : mins;
    
          (this.refs.timer as HTMLElement).textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    componentWillUnmount() {
        this.stopTimer();
    }

    render() {
        return <span ref="timer" style={{ float: "right" }} ></span>
    }
}