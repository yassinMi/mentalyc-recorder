import React, { createRef, useContext, useEffect, useMemo, useRef, useState } from "react"
import { RecordingContext, RecordingRomStatus } from "./Contexts"
import { RecordingCardStatusTag } from "./RecordingCardStatusTag"
import { RecordingHelper } from "./Services/RecordingService"
import { Spinner } from "./Spinner"
import { Recording, RecordingItemStatus, RecordingM, RecordingType } from "./Types/Types"
import { DurationToUserFreindlyString } from "./Utils"


type RecordingRoom_Props = {
     minimizeCb: () => void ,
     onRecordingSubmitRequested:(r:Recording,r_data:RecordingM)=>void,
     CloseCb:() => void 
    }

export const RecordingRoom: React.FC<RecordingRoom_Props> = ({ minimizeCb,onRecordingSubmitRequested,CloseCb }) => {

    const { recordingTitle, setRecordingTitle, recordingDuration, setRecordingDuration, recordingType, setRecordingType, recordingStatus, setRecordingStatus, recordingHelper, recording, setRecording,mediaStream,isChangingRecordingType,initErrorString,isDirty } = useContext(RecordingContext);
    //const [status, setRecordingStatus] = useState<RecordingRomStatus>(RecordingRomStatus.ready)
    //const [recordingType, setRecordingType] = useState(RecordingType.audio)
    //const [title, setTitle] = useState<string>("Session #1")
    //const [recordingDuration, setRecordingDuration] = useState(0)


    const [isCameraOn, setIsCameraOn] = useState(recordingType == RecordingType.audioAndVideo)
    const [isRecordingPaused, setIsRecordingPaused] = useState(recordingStatus == RecordingRomStatus.recordingPaused)
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isStartingRecording, setIsStartingRecording] = useState(false)
    const [isEditingTitle,setIsEditingTitle] = useState(false)
    const [currentEditingTitle,setCurrentEditingTitle]  =  useState("")
    

    const audioLevelRef = useRef<HTMLDivElement>(null);
    const rh = recordingHelper;

    const [isFadeIn, setIsFadeIn] = useState(false)
    //console.log("RecordingRoom render")


    useEffect(()=>{
        setCurrentEditingTitle(()=>{
            return recordingTitle;
        })
    },[recordingTitle])
    function animateAudioVolume(t:number){

        if(audioLevelRef.current){
            //console.log(`animateAudioVolume ${recordingStatus}`)

            if(isRecording()){


                if(recordingHelper.analyser){

                 const expectedMaxRms = 20;
                 var r = recordingHelper.GetCurrentVolumeLevel();
                 const minRatio = 0.42//thi is tuned to cover the microphone icon at the zero volum level
                 const flexRatio = 1-minRatio;
                 let  ratio =minRatio + (flexRatio*Math.atan((1*r.rms)/expectedMaxRms) );
                 //the ratio is strictly between minRatio and 1,
                 //atan provides a smooth mapping from unbound rms values to [0,1] 
                 //preventing any cliping effect
                 audioLevelRef.current.style.transform = `scale(${ratio})`;
                 audioLevelRef.current.style.opacity = ((ratio-minRatio)/flexRatio).toString();//this removes the min ratio effect because we want opacity to start from zero

                }
                
            }
            
        }
        requestAnimationFrame(animateAudioVolume)
    }

    const audioVolumeAnimationId = useRef<number>();


    useEffect(()=>{

        setIsFadeIn(true)
        
        if(recordingStatus==RecordingRomStatus.zero){
            setRecordingStatus(RecordingRomStatus.init)
        }

        return ()=>{
           
        }
    },[])
    useEffect(()=>{
        if(rh.mediaStream){
            if (videoRef.current) {
                videoRef.current.srcObject = rh.mediaStream;
            }
            recordingHelper.InitAnalyser();
        }
    },[mediaStream])

    useEffect(()=>{

        let id:number|undefined;

        if(recordingStatus=== RecordingRomStatus.recording){
            if(id===undefined){
                console.log("requestAnimationFrame ")
                id= requestAnimationFrame(animateAudioVolume)
    
            }
           
        }
        
        return ()=>{
            if(id!==undefined){
                console.log("cancelAnimationFrame ")
                cancelAnimationFrame(id)
            }
        }
    },[recordingStatus])

    function canChangeRecordingType() {
        return recordingStatus == RecordingRomStatus.ready;
    }
    function hndlToggleCameraClick() {
        if (canChangeRecordingType() == false) return;
        if(isChangingRecordingType) return;
        setRecordingType(isCameraOn ? RecordingType.audio : RecordingType.audioAndVideo);
        setIsCameraOn(!isCameraOn)
    }

    function hndlTogglePauseClick() {
        console.log("hndlTogglePauseClick")
        setIsRecordingPaused(prev => {
            console.log(`hndlTogglePauseClick - set status : prev${prev}`)

            if (prev == true) {

                rh.ResumeRecording();
                setRecordingStatus(RecordingRomStatus.recording);
                return false
            }
            else {
                if (!(rh.isPaused || rh.isPausing)){
                    rh.PauseRecording();
                }
                    else{
                        console.log(`already paused: ${rh.isPaused } ${rh.isPausing}`)
                    }
                setRecordingStatus(RecordingRomStatus.recordingPaused);
                return true

            }

        })
    }
    function hndlStartRecordingClick() {
        if (recordingStatus == RecordingRomStatus.ready) {
            rh.StartRecording(recordingType)
            setRecordingStatus(RecordingRomStatus.recording)//causes error
            setIsStartingRecording(true) ;
        }
    }
    function hndlEndRecordingClick() {
        console.log("hndlEndRecordingClick")
        setRecordingStatus((prev) => {
            console.log(`hndlEndRecordingClick - set status : prev${prev}`)

            if (prev == RecordingRomStatus.recording || prev == RecordingRomStatus.recordingPaused) {

                rh.EndRecording((rec: RecordingM) => {

                    setRecording(rec);
                });

                return RecordingRomStatus.recordingAvailable;
            }
            return prev;
        })

    }
    function isRecording() {
        return recordingStatus == RecordingRomStatus.recording || recordingStatus == RecordingRomStatus.recordingPaused
    }
    function hndlSubmitClick() {

        if (recording == null) throw new Error("no recording available")
 
        onRecordingSubmitRequested({
            duration:DurationToUserFreindlyString(recordingDuration) !,
            id:`${Math.floor(100000000+ (Math.random()*10000000))}`,
            status:RecordingItemStatus.uploading,
            timestamp:Date.now(),
            title:recordingTitle,
            type:recordingType
        },recording)
        clearRecordingState();
        
    }
    function hndlDownloadClick() {

        if (recording == null) throw new Error("no recording available")
        const videoUrl = URL.createObjectURL(recording.data);
        const downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.download = 'recorded-video.webm';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        clearRecordingState();
    }
    function hndlDeleteClick() {
        clearRecordingState();
    }
    function clearRecordingState(){
        setRecordingDuration(0)
        setRecording(null);
        setRecordingStatus(RecordingRomStatus.ready)
        setIsRecordingPaused(false);
        rh.Reset(false)
    }
    function hndlEditClick() {

        window.alert("this feature is not implemented yet")
    }
    function hndlStartEndRecordingClick() {

        console.log("hndlStartEndRecordingClick")
        if (isRecording()) {
            hndlEndRecordingClick();
        }
        else {
            hndlStartRecordingClick();
        }
    }
    function hndlMinimizeClick() {
        //setIsFadeIn(false)
        //setInterval(()=>{
        //    minimizeCb();
        //},200)
        minimizeCb();
    }
    function hndlCloseClick(){
        CloseCb();

    }
    function hndlRetryInitClick(){

        recordingHelper.Reset(true);
        setRecordingStatus(RecordingRomStatus.init);//triggers a media stream initialization via useEfect in the provider
    }
    
    function hndlEditingTitleChanged(event:React.ChangeEvent<HTMLInputElement>){
        console.log("event.target.textContent")
        console.log(event.target.value)
        setCurrentEditingTitle(event.target.value??"")
    }
    function hndlEditTitleClick(){
        setIsEditingTitle(true);
    }
    function isValidTitle(title:string|undefined){
        return !!title && (title.length>1)
    }
    function hndlSaveTitleClick(){
       setIsEditingTitle(()=>{
           if(isValidTitle(currentEditingTitle)){
               setRecordingTitle(currentEditingTitle)

               return false
           }
           return true;
       })
    }
    function hndlEditingTitleInputKeyDown(ev: React.KeyboardEvent){
        if(ev.key=="Enter"){
            hndlSaveTitleClick()
        }
    }

    return (
        <div className="recording-room-wrapper">
            <div className={`recording-room ${isFadeIn?" popup-fadeIn":"popup-fadeOut"}`}>
                <div className="recording-upper-control-panel">

                    <div className="title-and-tags">

                        {isEditingTitle&&(
                            <>
                                <input onKeyDown={hndlEditingTitleInputKeyDown} autoFocus type={"text"} value={currentEditingTitle}  onChange={hndlEditingTitleChanged}  ></input>
                                <button className="icon-action-button-lite" onClick={hndlSaveTitleClick} >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
</svg>
                        </button>
                            </>
                        )}
                        {!isEditingTitle&&(
                            <>
                        <span  >{recordingTitle}</span>
                        <button className="icon-action-button-lite" onClick={hndlEditTitleClick} >
                        <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
</svg>
                        </button>
                        </>
                        )}

                        
                        {recordingStatus == RecordingRomStatus.recording && (
                            <span className="tag icon red">
                                <div className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-record-fill" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10" />
                                    </svg>
                                </div>
                                <span className="content">recording</span>
                            </span>
                        )}
                    </div>

                    {isDirty&&(
                        <button className="icon-action-button icon16" onClick={hndlMinimizeClick}>
                        <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
</svg>
                    </button>
                    )}
                    {!isDirty&&(
                        <button className="icon-action-button" onClick={hndlCloseClick}>
                        <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
</svg>
                    </button>
                    )}
                    
                </div>
                <div className="video-wrapper">
                    <video className={`${isCameraOn?"active":""}`} ref={videoRef} id="video" playsInline autoPlay></video>
                    <div className="video-wrapper-overlay">
                        {(recordingStatus===RecordingRomStatus.init || isChangingRecordingType)&&(
                            <Spinner label="Initializing"></Spinner>
                            
                        )}
                        {(recordingStatus===RecordingRomStatus.initFailed)&&(
                            <div className="error-panel-wrapper">
                            <span>{initErrorString}</span>
                            <button className="secondary-button" onClick={hndlRetryInitClick} >Retry</button>
                            </div>
                        )}
                        {isRecording()&&recordingType==RecordingType.audio&&(
                            <div className="recording-audio-visual-wrapper">
<div ref={audioLevelRef} className="recording-audio-visual">
                                
                            </div>
                            <div className="recording-audio-visual-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" className="bi bi-mic-fill" viewBox="0 0 16 16">
  <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z"/>
  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/>
</svg>
                            </div>
                            
                            </div>
                            
                        )}
                    </div>
                    <div className="video-control-panel">
                        {(recordingStatus == RecordingRomStatus.ready || recordingStatus == RecordingRomStatus.recording || recordingStatus == RecordingRomStatus.recordingPaused) && (
                            <button className={`start-end-recording-button   ${((isRecording()) ? " square" : "")}`} onClick={hndlStartEndRecordingClick}>
                                <div></div>
                            </button>
                        )}
                        {/*{status== RecordingRomStatus.ready &&(
                            <button className="start-recording-button" onClick={hndlStartRecordingClick}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-record-fill" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10" />
                            </svg>
                        </button>
                        )}
                        {(status== RecordingRomStatus.recording||status==RecordingRomStatus.recordingPaused) &&(
                            <button className="end-recording-button" onClick={hndlEndRecordingClick}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-stop-fill" viewBox="0 0 16 16">
  <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5"/>
</svg>
                        </button>
                        )}*/}
                        {recordingStatus == RecordingRomStatus.ready && (
                            <div className={`toggle-wrapper small ${isCameraOn ? 'on' : ''}`} onClick={hndlToggleCameraClick}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video-fill" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video-off-fill" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M10.961 12.365a2 2 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272zm-10.114-9A2 2 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728zm9.746 11.925-10-14 .814-.58 10 14z" />
                                </svg>

                            </div>
                        )}


                        {(recordingStatus == RecordingRomStatus.recording || recordingStatus == RecordingRomStatus.recordingPaused) && (
                            <div className={`toggle-wrapper white small ${isRecordingPaused ? 'on' : ''}`} onClick={hndlTogglePauseClick}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pause-fill" viewBox="0 0 16 16">
                                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pause-fill" viewBox="0 0 16 16">
                                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
                                </svg>

                            </div>

                        )}
                        {recordingStatus == RecordingRomStatus.recordingAvailable && (
                            <div className="recording-available-actions-wrapper">

                                <button className="destructive-button" onClick={hndlDeleteClick}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                    </svg>
                                    <span>Delete</span>
                                </button>
                                <button className="secondary-button" onClick={hndlEditClick}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-scissors" viewBox="0 0 16 16">
                                        <path d="M3.5 3.5c-.614-.884-.074-1.962.858-2.5L8 7.226 11.642 1c.932.538 1.472 1.616.858 2.5L8.81 8.61l1.556 2.661a2.5 2.5 0 1 1-.794.637L8 9.73l-1.572 2.177a2.5 2.5 0 1 1-.794-.637L7.19 8.61zm2.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0m7 0a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0" />
                                    </svg>
                                    <span>Edit</span>
                                </button>
                                <button className="secondary-button" onClick={hndlDownloadClick}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-download" viewBox="0 0 16 16">
                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
                                    </svg>
                                    <span>Download</span>
                                </button>

                                <button className="primary-button" onClick={hndlSubmitClick}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z" />
                                    </svg>
                                    <span>Submit</span>
                                </button>
                            </div>
                        )}

                    </div>
                </div>
                <div className="recording-footer">
                    {recordingStatus!=RecordingRomStatus.initFailed
                    &&recordingStatus!=RecordingRomStatus.init
                    &&recordingStatus!=RecordingRomStatus.zero
                    &&
                    (
                    <span className="recording-time">{DurationToUserFreindlyString(recordingDuration)}</span>

                    )}


                </div>

            </div>


        </div>)
}