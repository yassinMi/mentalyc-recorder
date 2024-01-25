import EventEmitter from "events";
import { Recording, RecordingM, RecordingServerProgressUpdate } from "../Types/Types";


export interface IApiService{
    /**
     * e.g. to connect to the server (if applicable) for real time socket communication
     */
    init():Promise<void>
    /**
     * clean up (e.g. connections)
     */
    close():Promise<void>
    getAllRecordings():Promise<Recording[]>
    submitRecording(r:Recording,recordingData: RecordingM,cb:(r:Recording,progress:RecordingServerProgressUpdate)=>void):void
}