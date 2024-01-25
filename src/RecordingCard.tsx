import { Component } from "react"
import { Recording, RecordingServerProgressUpdate, RecordingsStateManager } from "./ApiService"
//@ts-ignore
import { ProgressBar } from "./ProgressBar.tsx"
//@ts-ignore
import { RecordingCardStatusTag, RecordingItemStatus } from "./RecordingCardStatusTag.tsx"
//@ts-ignore
import { DateToUserFreindlyString } from "./Utils.ts"

type RecordingCard_props = {
    id:string,
    title: string,
    status: RecordingItemStatus
    timestamp: Date,
    duration: string,
    uploadProgress?:number
}
type RecordingCard_state = {
    status: RecordingItemStatus,
    uploadProgress?:number
}
/**
 * 
 */
export class RecordingCard extends Component<RecordingCard_props, RecordingCard_state>{
    constructor(props: Readonly<RecordingCard_props>) {
        super(props)
        this.state = {
            status: props.status,
            uploadProgress:props.uploadProgress??0
        }
    }
    
    render() {
        return (
            <div className="recording-card">
                <div className="recording-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-soundwave" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5" />
                    </svg>
                </div>
                <div className="recording-card-content">
                    <div className="title">
                        <span>{this.props.title}</span>
                        <RecordingCardStatusTag status={this.props.status} />
                    </div>
                    <div className="second-row">
                    <span className="timestamp">{DateToUserFreindlyString(this.props.timestamp)}</span>
                    <span className="duration">{this.props.duration}</span>
                    </div>
                    <div></div>

                   
                </div>
                {this.props.status== RecordingItemStatus.uploading&&
                 <ProgressBar ratio={this.props.uploadProgress}/>}
               


            </div>
        )
    }
}