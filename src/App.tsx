import logo from './logo.svg';
import './App.css';
import { RecordingCard } from './RecordingCard';
import { useContext, useEffect, useState } from 'react';
import { Spinner } from './Spinner';
import { RecordingRoom } from './RecordingRoom';
import { RecordingRoomCard } from './RecordingRoomCard';
import { RecordingContext, RecordingRomStatus } from './Contexts';
import { RecordingContextProvider } from './RecordingContextProvider';
import { Recording, RecordingItemStatus, RecordingM, RecordingServerProgressUpdate } from './Types/Types';
import { ExpressApiService, MockApiService } from './Services/ApiService';
import { IApiService } from './Services/IApiService';
import { io } from 'socket.io-client';

function App() {
  const [recordingsList, setrecordingsList] = useState([] as Recording[]);
  const [isLoadingRecordsList, setIsLoadingRecordsList] = useState(false);
  const [failedLoadingRecordsList, setFailedLoadingRecordsList] = useState("");
  const [isRecordingRoomOpen, setIsRecordingRoomOpen] = useState(false);
  const [isRecordingRoomMaximized, setIsRecordingRoomMaximized] = useState(true);

  const [isInitializingApiService,setIsInitializingApiService] = useState(false)
  const [failedInitializingApiService,setFailedInitializingApiService] = useState("")

  //# use one of the api implementations:
  //const CurrentApiService = MockApiService.getInstance() as IApiService //state saved in front end
  const CurrentApiService = ExpressApiService.getInstance() as IApiService //recording sent to the server, which notitifies the front end using websockets (this requires the server app)


  const { setRecordingStatus, recordingHelper, isDirty } = useContext(RecordingContext);

  function onRecordingSubmitRequested(recording: Recording, recordingData: RecordingM) {

    //# add to the list and track server progress
    const progressCb = (r: Recording, prog: RecordingServerProgressUpdate) => {
      console.log(`progressCb ${r.id} ${r.title} ${prog.uploadingProgress}`)

      setrecordingsList((prev_updatedList) => {
        const updatedList = [...prev_updatedList];

        let ix = updatedList.findIndex(i => i.id === r.id)
        let old = updatedList[ix]
        updatedList[ix] = {
          ...old,
          status: prog.status == "done" ? RecordingItemStatus.done : prog.status == "processing" ? RecordingItemStatus.processing : prog.status == "uploading" ? RecordingItemStatus.uploading : old.status,
          uploadProgress: prog.uploadingProgress
        };
        return updatedList

      })
    }
    CurrentApiService.submitRecording(recording, recordingData, progressCb)

    setrecordingsList(() => {
      return [recording, ...recordingsList]
    })

    setTimeout(() => onCloseRecordingRoom(), 0)

  }


  useEffect(() => {

    function hndlbeforeunload(ev: BeforeUnloadEvent) {
      if (isDirty) ev.returnValue = "you have unsaved recording"

    }
    window.addEventListener("beforeunload", hndlbeforeunload)
    return () => { window.removeEventListener("beforeunload", hndlbeforeunload) }
  }, [isDirty])

  //console.log("App render")
  useEffect(() => {
    //# fetching data via http endpoint
    const fetchRecordings = async () => {
      if (isLoadingRecordsList) return
      setIsLoadingRecordsList(true)
      try {
        var recordings = await CurrentApiService.getAllRecordings();
        setrecordingsList(recordings)
      }
      catch (error:any){
        setFailedLoadingRecordsList(error?.message|| "failed to load recordings")
      }
      finally {
        setIsLoadingRecordsList(false)
      }

    }
    fetchRecordings();

    //# initializing the api sqervice
    const initApi = async ()=>{
      if(isInitializingApiService) return;
      setIsInitializingApiService(true)
      try {
        await CurrentApiService.init();
        setFailedInitializingApiService("")
      } catch (error:any) {
        setFailedInitializingApiService(error?.message||"failed to connect to the server. (make sure the server app is running, or use ApiMock instead")
      }
      finally{
        setIsInitializingApiService(false)
      }
    }
    initApi()

    return () => {
      CurrentApiService.close()
    };



  }, []);




  function onMinimizeRecordingRoom() {
    setIsRecordingRoomMaximized(false)
  }
  function onCloseRecordingRoom() {
    recordingHelper.Reset(true);
    setRecordingStatus(RecordingRomStatus.zero)
    setIsRecordingRoomOpen(false)
  }
  function onMaximizeRecordingRoom() {
    setIsRecordingRoomMaximized(true)
  }
  function hndlNewRecordingClick() {
    setIsRecordingRoomOpen(true);
  }
  function hndlApClick() {
    setIsLoadingRecordsList(true)
    setIsLoadingRecordsList(false)
  }
  return (
    <div id="main" onClick={hndlApClick}>



      <div style={{ marginBottom: "16px" }} className="horizontal-flex-center-spacebetween">
        <div className="section-header h1">Recordings</div>

        <button  disabled={isRecordingRoomOpen} className="primary-button border-rd-12" onClick={hndlNewRecordingClick}>
          <svg xmlns="http://www.w3.org/2000/svg" height={16} fill="currentColor" className="bi bi-mic-fill" viewBox="0 0 16 16">
            <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z" />
            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
          </svg>
          <span> New Recording</span>

        </button>
      </div>
      <div className='recordings-top-section'>
      {(isLoadingRecordsList||isInitializingApiService) && <Spinner label={`${isInitializingApiService&&isLoadingRecordsList?"Connecting to the server, loading recordings":isLoadingRecordsList?"Loading recordings":"Connecting to the server"}`} />}
        {failedLoadingRecordsList != "" && <div className='error'>{failedLoadingRecordsList}</div>}
        {failedInitializingApiService != "" && <div className='error'>{failedInitializingApiService}</div>}

      </div>
      {!(isLoadingRecordsList||isInitializingApiService)&&(
        <div className="recordings-wrapper">
       
       {
         (recordingsList).map(r => (<RecordingCard key={r.id} id={r.id} type={r.type} title={r.title} status={r.status} duration={r.duration} timestamp={new Date(r.timestamp)} uploadProgress={r.status == RecordingItemStatus.uploading ? r.uploadProgress : undefined}></RecordingCard>))
       }
     </div>
      )}
      

      {isRecordingRoomOpen && isRecordingRoomMaximized && (
        <RecordingRoom CloseCb={onCloseRecordingRoom} minimizeCb={onMinimizeRecordingRoom} onRecordingSubmitRequested={onRecordingSubmitRequested} />

      )}
      {isRecordingRoomOpen && !isRecordingRoomMaximized && (
        <RecordingRoomCard maximizeCb={onMaximizeRecordingRoom} />

      )}


<div className='app-footer'>
  <span>demo app by YassinMi</span>
</div>
    </div>
  );
}

export default App;
