import React, { useContext, useMemo, useRef, useState } from "react"
import { RecordingContext, RecordingRomStatus } from "./Contexts"
import { RecordingCardStatusTag } from "./RecordingCardStatusTag"
import { RecordingHelper } from "./Services/RecordingService"
import { DurationToUserFreindlyString } from "./Utils"



type RecordingRoomCard_Props = { maximizeCb: () => void }

export const RecordingRoomCard: React.FC<RecordingRoomCard_Props> = ({ maximizeCb }) => {

    const {recordingTitle,setRecordingTitle,recordingDuration,setRecordingDuration,recordingType,setRecordingType,recordingStatus,setRecordingStatus} = useContext(RecordingContext);




    function canChangeRecordingType() {
        return recordingStatus == RecordingRomStatus.ready;
    }



    function isRecording() {
        return recordingStatus == RecordingRomStatus.recording || recordingStatus == RecordingRomStatus.recordingPaused
    }


    function hndlMaximizeClick() {
        maximizeCb();
    }
    return (
        <div className="recording-room-card">
            <div>
            <span className="title">{recordingTitle}</span>
            <span className="duration">{ DurationToUserFreindlyString(recordingDuration) }</span>
            </div>
            <button className="icon-action-button icon16" onClick={hndlMaximizeClick}>
            <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" className="bi bi-chevron-up" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
</svg>
            </button>
            

        </div>)
}