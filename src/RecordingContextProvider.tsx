import React, { ReactNode, useEffect, useMemo, useState } from "react"
import { RecordingContext, RecordingM, RecordingRomStatus, RecordingType } from "./Contexts"
import { RecordingHelper } from "./Services/RecordingService"

type RecordingContextProvider_Props = {
    children:ReactNode
}
export const RecordingContextProvider:React.FC<RecordingContextProvider_Props> = ({children})=>{
     //# recording state (todo: move to a RecordingContextProvider component):
  const [recordingStatus, setRecordingStatus] = useState<RecordingRomStatus>(RecordingRomStatus.zero)
  const [recordingType, setRecordingType] = useState(RecordingType.audio)
  const [recordingTitle, setRecordingTitle] = useState<string>("Session #1")
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recording, setRecording] = useState<RecordingM|null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream|undefined>(undefined)
  const [initErrorString, setInitErrorString] = useState<string|undefined>(undefined)
  const [isDirty, setIsDirty] = useState(false)//used to decied whether to close the modal or minimize it (a dirty state has user satte that shouldn't be lost e.g session title or an ongoing recording operation)

  const [isChangingRecordingType,setIsChangingRecordingType] = useState(false)
  const [isInitializing,setIsInitializing] = useState(false)
  const recordingHelper = useMemo(()=>new RecordingHelper(), []);
  //console.log("RecordingContextProvider render")

  useEffect(()=>{

    recordingHelper.on("recordingDuration",(duration:number)=>{
        setRecordingDuration(duration);
    })
    const streamAvailableCb = (s: MediaStream) => {
      setMediaStream(s)
    };
    recordingHelper.on("streamAvailable",streamAvailableCb )

    
    return ()=>{
        recordingHelper.removeAllListeners("recordingDuration")
        recordingHelper.removeListener("streamAvailable",streamAvailableCb)

    }
  },[])

  
  useEffect(()=>{

    if(recordingStatus==RecordingRomStatus.zero) return;
    if(recordingStatus==RecordingRomStatus.init) return;
    const changeType = async()=>{
      if(isChangingRecordingType) return;
      try   
      {
        setIsChangingRecordingType(true)
        try{
          await recordingHelper.SetMediaStreamType(recordingType);
        }
        catch (err:any){
          setRecordingStatus(RecordingRomStatus.initFailed)
          setInitErrorString(err?.message||err||"failed to initialize")
        }

      }
      finally{
        setIsChangingRecordingType(false)
      }
    }
    changeType();      
  },[recordingType,recordingStatus])

  useEffect(()=>{

    
    if(recordingStatus==RecordingRomStatus.init){
      const startStream =async ()=>{
        if(isInitializing) return;
        setIsInitializing(true)

        try {
          await recordingHelper.SetMediaStreamType(recordingType)
        } 
        catch (err:any) {
          setRecordingStatus(RecordingRomStatus.initFailed)
          setInitErrorString(err?.message||err||"failed to initialize")
        }
        finally{
          setIsInitializing(false)
          setRecordingStatus(RecordingRomStatus.ready)
        }
      }
      startStream();
       
    }
  },[recordingStatus])
  useEffect(()=>{

    setIsDirty(()=>{
      if(recording!=null) return true;
      if(recordingStatus==RecordingRomStatus.recording) return true
      if(recordingStatus==RecordingRomStatus.recordingAvailable) return true
      if(recordingStatus==RecordingRomStatus.recordingPaused) return true
      return false;
    })
  },[recordingTitle,recordingStatus,recording])
 
 

  return (
    <RecordingContext.Provider value={{recordingDuration:recordingDuration,setRecordingDuration:setRecordingDuration, recordingStatus:recordingStatus,setRecordingStatus:setRecordingStatus, recordingTitle:recordingTitle,setRecordingTitle:setRecordingTitle, recordingType:recordingType,setRecordingType:setRecordingType,recordingHelper:recordingHelper,recording:recording,setRecording:setRecording,mediaStream:mediaStream,setMediaStream:setMediaStream,isChangingRecordingType:isChangingRecordingType,initErrorString:initErrorString,isDirty:isDirty}} >
     {children}
    </RecordingContext.Provider>
  )
 
}