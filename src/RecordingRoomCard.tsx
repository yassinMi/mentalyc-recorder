import React, { useContext, useMemo, useRef, useState } from "react"
import { submitRecording } from "./ApiService"
import { RecordingContext, RecordingRomStatus, RecordingType } from "./Contexts"
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
            <button className="icon-action-button" onClick={hndlMaximizeClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-bar-up" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M3.646 11.854a.5.5 0 0 0 .708 0L8 8.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708M2.4 5.2c0 .22.18.4.4.4h10.4a.4.4 0 0 0 0-.8H2.8a.4.4 0 0 0-.4.4" />
                </svg>
            </button>
            

        </div>)
}