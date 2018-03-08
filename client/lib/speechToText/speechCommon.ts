import { SpeechToTextService, SpeechPausedResult } from './speechService';
import { Event, Emitter } from './util';
import { Microphone } from '../Audio/audio';

declare const RecordRTC;
declare const StereoAudioRecorder;

export async function  initializeSpeechToText(): Promise<SpeechToTextService> {
    const response = await fetch('/devenv.json');
    const { bsKey } = await response.json();

    const speechService = new SpeechToTextService(bsKey);
    return speechService;
}

export function startRecording(recorder: any, microphone: Microphone, onSpeechEnded: Event<SpeechPausedResult>, handleTranscript: (transcript: string, startTimeText: string, endTimeText: string, duration: number) => void) {
    recorder = RecordRTC(microphone.stream, {
        type: 'audio',
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1,
        sampleRate: 48000,
        bitsPerSecond: 320000, // 320kb/s
        disableLogs: false
    });

    let startTime = new Date().getTime();
    recorder.startRecording();

    onSpeechEnded(result => {
        console.log("speech ended");
        const durationSpeech = (result.duration / 1000000000) * 100;

        recorder.stopRecording(() => {
            console.log("stop recording");
            const startTimeText = startTime.toString();

            const endTimeText = new Date().getTime().toString();
            if (result.text != "") {
                const transcript = result.text;
                handleTranscript(transcript, startTimeText, endTimeText, durationSpeech);
            }
        });

        startTime = new Date().getTime();
        recorder.startRecording();
        console.log("start recording");
    });
}