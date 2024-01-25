import { createContext } from "react";
import { RecordingHelper } from "./Services/RecordingService";
import { RecordingM, RecordingType } from "./Types/Types";


export enum RecordingRomStatus {
    /**currently we don't need recording functionality (recording popup still closed) */
    zero,
    /**we havent obtained the media stream yet*/
    init,
    /**currently previewing, and ready to start recording, user can change the recording type(toggle camera) */
    ready,
    /**currently recording */
    recording,
    /**currently recording and paused */
    recordingPaused,
    /**new recording ended, waiting for submit or delete actions */
    recordingAvailable,
    /**when obtaining media streams fails (e.g permission denied), user can retry */
    initFailed
}

export type RecordingContextType = {
    recordingStatus:RecordingRomStatus,
    setRecordingStatus: React.Dispatch<React.SetStateAction<RecordingRomStatus>>
    recordingTitle:string,
    setRecordingTitle: React.Dispatch<React.SetStateAction<string>>
    recordingType:RecordingType
    setRecordingType: React.Dispatch<React.SetStateAction<RecordingType>>
    recordingDuration:number
    setRecordingDuration: React.Dispatch<React.SetStateAction<number>>
    recordingHelper:RecordingHelper
    recording:RecordingM|null
    setRecording:React.Dispatch<React.SetStateAction<RecordingM|null>>
    mediaStream?:MediaStream
    setMediaStream:React.Dispatch<React.SetStateAction<MediaStream|undefined>>
    isChangingRecordingType:boolean
    initErrorString?:string
    isDirty:boolean

}
export const RecordingContext = createContext<RecordingContextType>({
    recordingStatus:RecordingRomStatus.zero,
    setRecordingStatus:()=>{},
    recordingDuration:0,
    setRecordingDuration:()=>{},
    recordingTitle:"",
    setRecordingTitle:()=>{},
    recordingType:RecordingType.audio,
    setRecordingType:()=>{},
    recordingHelper:new RecordingHelper(),
    recording:null,
    setRecording:()=>{},
    setMediaStream:()=>{},
    isChangingRecordingType:false,
    isDirty:false,
})