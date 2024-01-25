import EventEmitter from "events";
import { Recording, RecordingM, RecordingServerProgressUpdate } from "../Types/Types";


export interface IApiService{
    getAllRecordings():Promise<Recording[]>
    submitRecording(r:Recording,recordingData: RecordingM,cb:(r:Recording,progress:RecordingServerProgressUpdate)=>void):void
}