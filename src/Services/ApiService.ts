import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import EventEmitter from "events";
import { io, Socket } from "socket.io-client";
import { Recording, RecordingItemStatus, RecordingM, RecordingServerProgressUpdate } from "../Types/Types";
import { delay } from "../Utils";
import { IApiService } from "./IApiService";
/**
 * a mocked api service
 */

export class MockApiService implements IApiService {

    /**
     * a dummy in memory list of records
     */
    private lst: Recording[] = [
        {
            id: "1",
            title: "Session #1",
            duration: "54:23",
            status: RecordingItemStatus.done,
            timestamp: Date.UTC(2024, 1, 21, 5, 56, 1)
        },
        {
            id: "2",
            title: "Session #2",
            duration: "45:03",
            status: RecordingItemStatus.done,
            timestamp: Date.UTC(2024, 1, 22, 5, 50, 1)
        },
        {
            id: "3",
            title: "Session #3",
            duration: "32:44",
            status: RecordingItemStatus.done,
            timestamp: Date.UTC(2024, 1, 23, 8, 8, 1)
        },

        {
            id: "4",
            title: "Session #4",
            duration: "55:10",
            //status:RecordingItemStatus.processing,
            status: RecordingItemStatus.done,
            timestamp: Date.UTC(2024, 1, 23, 9, 26, 1)
        },
        {
            id: "5",
            title: "Session #5",
            duration: "65:19",
            //status:RecordingItemStatus.uploading,
            status: RecordingItemStatus.done,
            timestamp: Date.UTC(2024, 1, 24, 7, 42, 1),
            uploadProgress: 0.9
        }
    ];
    public async init(): Promise<void> {
        return;// this impl doesn't need initialization
    }
    public async close(): Promise<void> {
        return;
    }

    public async getAllRecordings(): Promise<Recording[]> {
        console.log("getAllRecordings")
        await delay(2000);
        return JSON.parse(JSON.stringify(this.lst));
    }

    private static Instance?: MockApiService

    public static getInstance() {
        if (MockApiService.Instance === undefined) {
            MockApiService.Instance = new MockApiService();
        }
        return MockApiService.Instance;
    }

    submitRecording(r: Recording, recordingData: RecordingM, cb: (r: Recording, progress: RecordingServerProgressUpdate) => void) {
        console.log(`fake uploading recording ${r.id} ${r.title}`)
        let timeToUpload = 1000 * ((Math.random() * 30) + 10);
        let timeToProcess = 1000 * ((Math.random() * 40) + 15);

        cb(r, { processingProgress: 0, uploadingProgress: 0, status: "uploading" })
        let processCc = Math.max(1, Math.floor(timeToProcess / 200));
        let uploadCc = Math.max(1, Math.floor(timeToUpload / 200));
        let processProgress = 0;
        let uploadProgress = 0;
        let isUploading = true
        let isProcessing = false
        const reportProgress = () => {
            cb(r, { processingProgress: processProgress / processCc, uploadingProgress: uploadProgress / uploadCc, status: isUploading ? "uploading" : isProcessing ? "processing" : "done" })
        }
        let intv = setInterval(() => {
            if (isUploading) {
                uploadProgress++;
                if (uploadProgress == uploadCc) {
                    isUploading = false;
                    isProcessing = true;
                }
                reportProgress();

            }
            if (isProcessing) {
                processProgress++;
                if (processProgress == processCc) {
                    isUploading = false;
                    isProcessing = false;
                    clearInterval(intv)
                }
                reportProgress();

            }

        }, 200)

        this.lst.push(r)
    }



}
/**
 *  similar to MockApiService but connects to a real express server 
 */
 export class ExpressApiService implements IApiService {
    private static Instance?: ExpressApiService

    public static getInstance() {
        if (ExpressApiService.Instance === undefined) {
            //ExpressApiService.Instance = new ExpressApiService("http://localhost:3001");
            ExpressApiService.Instance = new ExpressApiService("");
        }
        return ExpressApiService.Instance;
    }
    private baseUrl: string;
    private socket?:Socket
  
    constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
    }
  
    public  init() {
        console.log("init api express")
        return new  Promise<void>((res,rej)=>{
            this.socket = io('http://localhost:3001');
            this.socket = io();
            this.socket.on("connect",()=>{
                console.log("socket connect, adding fake delay")
                setTimeout(() => {
                    res();
                }, 2000);
                
            })
            this.socket.on("recordingStatusUpdate",(recordingId,update)=>{
                console.log(`recieved update ${recordingId} ${update}`)
                if(recordingId in this.progressCallbacks ){
                    console.log(`recordingId in this.progressCallbacks`)
                    let item = this.progressCallbacks[recordingId];
                    item.cb(item.recording,update)
                    //normally we would remove this when detecting the last update, but now there's only one update (as we don't support processing progress)
                    delete this.progressCallbacks[recordingId]
                }
                else{
                    console.log(`recordingId not in this.progressCallbacks`)
                }
            })
            this.socket.on("connect_error",()=>{
                console.log("socket connect_error")
                rej();
            })
            this.socket.on("hello",n=>{
                console.log(n)
            })
            
        })
    }
    public async close(): Promise<void> {
        if(this.socket){
            this.socket.close()
        }
    }
    public async getAllRecordings(): Promise<Recording[]> {
      try {
        const response = await axios.get<Recording[]>(`${this.baseUrl}/recordings`);
        return response.data;
      } catch (error) {
        // Handle error, e.g., log it or throw a custom exception
        console.error('Error fetching recordings:', error);
        throw error;
      }
    }
  
    /**
     * by recording id
     */
    private progressCallbacks:Record<string,{recording:Recording,cb:(recording: Recording, progress: RecordingServerProgressUpdate) => void}> = {} 
    public submitRecording(
      recording: Recording,
      recordingData: RecordingM,
      progressCallback: (recording: Recording, progress: RecordingServerProgressUpdate) => void
    ): void {
      const uploadUrl = `${this.baseUrl}/upload`; 
  

      const formData = new FormData();
      formData.append('recording', JSON.stringify(recording));
      formData.append('data', recordingData.data, 'recording.raw'); 
  
      const config: AxiosRequestConfig = {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const uploadProgress = (progressEvent.loaded / progressEvent.total) ;
            progressCallback(recording, { processingProgress: 0, uploadingProgress: uploadProgress, status: 'uploading' });
          }
        },
        
      };
  
      axios.post(uploadUrl, formData, config)
        .then((response: AxiosResponse) => {
            console.log(`response: ${response}`)
            if(response.status==200){
                this.progressCallbacks[recording.id]={cb:progressCallback,recording:recording} ;
                recording.status = RecordingItemStatus.processing;
                progressCallback(recording, { processingProgress: 0, uploadingProgress: 1, status: 'processing' });
            }
          
        })
        .catch((error) => {
          console.error('Error uploading recording:', error);
          throw error;
        });
    }
  }
  



declare interface RecordingsStateManager_ {
    on(event: 'recordingProgressUpdate', listener: (recording: Recording, progress: RecordingServerProgressUpdate) => void): this;
}

/**@deprecated  */
class RecordingsStateManager_ extends EventEmitter {

    /**
     * call this when the app recieves a message from the server about a recording state update,
     * this is emitted so child (card) componends can recieve them
     * @param recording 
     * @param progress 
     */
    public OnProgress(recording: Recording, progress: RecordingServerProgressUpdate) {
        this.emit("recordingProgressUpdate", recording, progress);
    }
}
//export const RecordingsStateManager = new RecordingsStateManager_();
