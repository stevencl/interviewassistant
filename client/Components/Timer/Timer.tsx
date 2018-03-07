import React from 'react';
import ReactDOM from 'react-dom';

declare const moment;

export default class Timer extends React.Component<any, any> {
    private timerInterval: NodeJS.Timer;

    startTimer() {
        const start = new Date();
        this.timerInterval = setInterval(() => {
          const millis = new Date().getTime() - start.getTime();
          const duration = moment.duration(millis, 'ms');
    
          let allSecs = Math.floor(millis / 1000);
          let secs = allSecs % 60;
          let mins = Math.floor(allSecs / 60);
    
          let seconds, minutes;
          seconds = secs < 10 ? `0${secs}` : secs;
          minutes = mins < 10 ? `0${mins}` : mins;
    
          (this.refs.timer as HTMLElement).textContent = `${minutes}:${seconds}`;
        }, 500);
    }

    stopTimer = () => {
        clearInterval(this.timerInterval);
    }

    componentWillUnmount() {
        this.stopTimer();
    }

    render() {
        return (
            <div className="controls-container">
               <div className="timer-container">
                    <span className="timer" ref="timer" style={{ }} ></span>
               </div> 
               <button onClick={this.stopTimer} className="timer__start-timer">Stop</button>
            </div>
        )
    }
}