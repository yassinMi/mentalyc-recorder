import EventEmitter from "events";
import { RecordingM, RecordingType } from "../Types/Types";



export class RecordingHelper extends EventEmitter {
    durationUpdater_intv_hndl?: NodeJS.Timer;
    mediaStream?: MediaStream;
    CurrentMediaStreamType: RecordingType = RecordingType.audio;


    /**
     * setter for debugging purposes
     * @param value 
     */
     private setMediaStream(value:MediaStream|undefined){
        if(this.mediaStream){
            if(this.mediaStream.getTracks().some(t=>t.readyState=="live")){
                console.warn(`setting media stream to undefined while another instance (${this.stringifyMediaStream(this.mediaStream)}) is open`)
            }
        }
        this.mediaStream = value;
        console.log(`mediaStream set to (${this.stringifyMediaStream(value)})`)

    }
    /**
     *
     */
    constructor() {
        super();
        console.log("ctor")


    }
    analyser?: AnalyserNode
    public InitAnalyser() {
        console.log("initializig analyser")
        if (!this.mediaStream) throw new Error("cannot initialize analyser before obtaining mediaStream");

        let ac = new AudioContext()
        let a = ac.createAnalyser()
        let soure = ac.createMediaStreamSource(this.mediaStream)
        soure.connect(a);
        a.fftSize = 256;
        this.analyser = a;


    }
    public GetCurrentVolumeLevel() {
        if (!this.analyser) throw new Error("must call initialize analyzer first")
        let bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const getRMS = (dataArray: Uint8Array): number => {
            let sum = 0;
            dataArray.forEach((value) => {
                sum += value * value;
            });
            const rms = Math.sqrt(sum / dataArray.length);
            return rms;
        };

        const calculateDecibel = (rms: number): number => {
            const decibel = 20 * Math.log10(rms / 256);
            return decibel;
        };

        this.analyser.getByteFrequencyData(dataArray);
        const rms = getRMS(dataArray);
        const decibel = calculateDecibel(rms);
        return { rms, decibel };

    }
    mediaRecorder: MediaRecorder | null = null;
    recordedChunks: Blob[] = [];
    startAndPauseTimestamps: number[] = []
    end_cb: ((recordingM: RecordingM) => void) | undefined

    isPaused = false;
    isPausing = false;
    isStartingRecording = false;
    isEnding = false;
    public StartRecording(type: RecordingType) {
        console.log("StartRecording")
        if (this.isStartingRecording) return;
        this.isStartingRecording = true;
        if (!this.mediaStream) {
            throw new Error("must call startMediaStream first before calling StartRecording")
        }
        if (type != this.CurrentMediaStreamType) {
            throw new Error("must change MediaStream type first before calling StartRecording")

        }

        console.log("mediaStream available...")
        this.emit("streamAvailable", this.mediaStream);
        this.mediaRecorder = new MediaRecorder(this.mediaStream)
        console.log(`mediaRecorder available... ${this.mediaRecorder}`)

        //@ts-ignore
        this.mediaRecorder.ondataavailable = (ev) => {
            if (ev.data.size > 0) {
                this.recordedChunks.push(ev.data);
            }
        };
        //@ts-ignore
        this.mediaRecorder.onpause = (ev) => {
            this.isPaused = true;
            this.isPausing = false;
            this.startAndPauseTimestamps.push(Date.now())
        }
        this.mediaRecorder.onresume = (ev) => {
            this.startAndPauseTimestamps.push(Date.now())
        }
        //@ts-ignore
        this.mediaRecorder.onstop = (ev) => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            this.recordedChunks = [];
            let recordingM = { data: blob } as RecordingM
            this.emit("recordingAvailable", recordingM);
            if (this.end_cb) {
                this.end_cb(recordingM);
            }
            this.mediaRecorder = null;
            clearInterval(this.durationUpdater_intv_hndl);
            this.isEnding = false;
            if (this.isPaused) {
                this.isPaused = false
            }
            else {//to avoid confusing the duration calculator we prevent adding a timestamp when the last one corresponds to a pause (todo: redesign this better)
                this.startAndPauseTimestamps.push(Date.now())
            }
        }

        this.mediaRecorder.onstart = (ev) => {
            this.startAndPauseTimestamps = [Date.now()]
        }
        this.mediaRecorder.start();

        this.durationUpdater_intv_hndl = setInterval(() => {

            if (this.mediaRecorder != null) {
                this.emit("recordingDuration", this.calculateDuration())
            }
        }, 500)


        this.isStartingRecording = false;


    }

    calculateDuration(): number {
        let res = 0
        var times = [...this.startAndPauseTimestamps]
        if (times.length % 2 == 1) {
            times.push(Date.now())
        }
        for (let i = 0; i < times.length; i += 2) {
            res += times[i + 1] - times[i];
        }
        return res
    }

    
    /**
     * for debugging purposes
     * @param value 
     * @returns 
     */
    stringifyMediaStream(value:MediaStream|undefined){
        if(value===undefined) return undefined
        return value.getTracks().map(t=>t.kind).join(",")
    }
    public PauseRecording() {
        console.log(`PauseRecording ${this.mediaRecorder}`)
        if (this.mediaRecorder === null) throw new Error("must call StartRecording first")
        if (this.isPaused) throw new Error("already paused")
        if (this.isPausing) return;
        this.isPausing = true;
        this.mediaRecorder.pause();

    }
    public ResumeRecording() {
        console.log("ResumeRecording")
        if (this.mediaRecorder === null) throw new Error("must call StartRecording first")
        if (!this.isPaused) throw new Error("must call PauseRecording first")
        this.mediaRecorder.resume();
    }
    public EndRecording(cb?: ((recordingM: RecordingM) => void)) {
        console.log("EndRecording")
        this.end_cb = cb;
        if (this.mediaRecorder === null) throw new Error("must call StartRecording first")
        if (this.isEnding) return;
        this.isEnding = true;
        this.mediaRecorder.stop();
    }

    /**
     * 
     * @param hard pass true to release teh stream resources if any (used when closing the modal)
     */
    Reset(hard:boolean) {
        console.log(`reset ${hard}`)
        if (this.mediaRecorder != null) throw new Error("must call StopRecording first")
        this.startAndPauseTimestamps = []
        this.end_cb = undefined

        if(hard && (this.mediaStream!=undefined)){
            this.mediaStream.getTracks().forEach(t=>t.stop())
            this.setMediaStream(undefined)
        }
        
    }
    private async tryStartStream(recordingType: RecordingType) {
        console.log(`tryStartStream (${recordingType==RecordingType.audio?"audio":"audioAndVideo"})`)
        if (this.mediaStream) return this.mediaStream;
        try{
            var ms = await navigator.mediaDevices.getUserMedia({ audio: true, video: recordingType == RecordingType.audioAndVideo });
        }
        catch(err){
            throw new Error(`Unable to access the microphone ${recordingType==RecordingType.audioAndVideo?" and camera":""}. please check your browser's settings (${err})`)
        }
        this.CurrentMediaStreamType = recordingType;
        this.setMediaStream(ms);
        this.emit("streamAvailable", this.mediaStream)
        return this.mediaStream;
    }
    /**
     * call this to change the @see mediaStream (used for preview )
     */
    public async SetMediaStreamType(type: RecordingType) {
        console.log(`SetMediaStreamType (${type==RecordingType.audio?"audio":"audioAndVideo"})`)
        let ms = await this.tryStartStream(type)
        if (this.CurrentMediaStreamType == type) return;
        else {
            if (this.CurrentMediaStreamType == RecordingType.audioAndVideo && type == RecordingType.audio) {
                //stoping the video track
                ms!.getTracks().forEach(t => {
                    console.log(t.kind)
                    if (t.kind == "video")
                        t.stop();
                });
                this.CurrentMediaStreamType = RecordingType.audio
            }
            else if (this.CurrentMediaStreamType == RecordingType.audio && type == RecordingType.audioAndVideo) {
                //closing the current stream and starting a new one
                if (this.mediaStream) {
                    this.mediaStream.getTracks().forEach(t => t.stop())
                }
                this.mediaStream = undefined;
                await this.tryStartStream(RecordingType.audioAndVideo);
                this.CurrentMediaStreamType = RecordingType.audioAndVideo
            }
        }


    }



}
