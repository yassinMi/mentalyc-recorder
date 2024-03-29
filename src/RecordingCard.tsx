import { Component } from "react"
import { ProgressBar } from "./ProgressBar"
import { RecordingCardStatusTag } from "./RecordingCardStatusTag"
import { RecordingItemStatus, RecordingType } from "./Types/Types"
import { DateToUserFreindlyString } from "./Utils"

type RecordingCard_props = {
    id:string,
    title: string,
    status: RecordingItemStatus
    timestamp: Date,
    duration: string,
    uploadProgress?:number
    type:RecordingType
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
                    {this.props.type==RecordingType.audio&&(<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-soundwave" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5" />
                    </svg>)}
                    {this.props.type==RecordingType.audioAndVideo&&(
                        <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" className="bi bi-film" viewBox="0 0 16 16">
                        <path d="M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm4 0v6h8V1zm8 8H4v6h8zM1 1v2h2V1zm2 3H1v2h2zM1 7v2h2V7zm2 3H1v2h2zm-2 3v2h2v-2zM15 1h-2v2h2zm-2 3v2h2V4zm2 3h-2v2h2zm-2 3v2h2v-2zm2 3h-2v2h2z"/>
                      </svg>
                    )}
                    
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
                 <ProgressBar ratio={this.props.uploadProgress??0}/>}
               


            </div>
        )
    }
}