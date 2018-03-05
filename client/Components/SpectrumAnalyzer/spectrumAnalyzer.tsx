import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from '../../lib/speechToText/util';
import { Microphone } from '../../Audio/audio';
import { SpeechToTextService, SpeechPausedResult } from '../../lib/speechToText/speechService';

export class SpectrumAnalyzer extends React.Component<SpectrumAnalyzerProps> {

    private animationFrameRequest: number;
  
    componentDidMount() {
      const canvas = this.refs.canvas as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      ctx.fillRect(0, 0, 100, 100);
  
      if (this.props.microphone != null)
      {
        const draw = () => {
          this.animationFrameRequest = requestAnimationFrame(draw);
          this.paint();
        };
        
        draw();
      }
      else
      {
        console.log('Microphone not ready yet for spectrum analyzer');
      }
  
    }
  
    componentWillUnmount() {
      cancelAnimationFrame(this.animationFrameRequest);
    }

    componentDidUpdate(prevProps, prevState){
      console.log('Spectrum DidUpdate with Microphone: ', this.props.microphone != null)

      const draw = () => {
        this.animationFrameRequest = requestAnimationFrame(draw);
        this.paint();
      };
      
      draw();
      
    }
  
    paint() {
      if (this.props.microphone == null)
      {
        return;
      }

      const frequencyData = this.props.microphone.getFloatFrequencyData();
      const canvas = this.refs.canvas as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
  
      ctx.fillStyle = 'rgb(250,250,250)';
      ctx.fillRect(0, 0, this.props.width, this.props.height);
  
      ctx.beginPath();
  
      // ctx.lineWidth = 5;
      // ctx.strokeStyle = 'rgba(128, 0, 0, 0.1)';
      ctx.fillStyle = 'rgb(240,240,240)';
  
      ctx.moveTo(this.props.width, this.props.height);
      ctx.lineTo(0, this.props.height);
  
      const barWidth = (this.props.width / frequencyData.length) * 2.5;
      let x = 0;
  
      for (let i = 0; i < frequencyData.length; i++) {
        const value = Math.max(frequencyData[i] + 120, 20) - 20;
        const barHeight = value * this.props.height / 140;
        const y = this.props.height - barHeight;
  
        ctx.lineTo(x, y);
        x += barWidth + 1;
      }
  
      ctx.lineTo(this.props.width, this.props.height);
      // ctx.stroke();
      ctx.fill();
    }
  
    render() {
      return <canvas ref="canvas" width={this.props.width} height={this.props.height}></canvas>;
    }
  }
  
  export type SpectrumAnalyzerProps = {
    microphone: Microphone,
    width: number,
    height: number
  };

