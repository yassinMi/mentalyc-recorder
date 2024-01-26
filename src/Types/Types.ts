

export enum RecordingType {
    audio="audio",
    audioAndVideo="audioAndVideo"
}
export type RecordingM = {
    data: Blob,
    type: RecordingType

}
export enum RecordingItemStatus {
    uploading="uploading", processing="processing", done="done", error="error"
}
export type Recording ={

    id:string,
    title:string,
    duration:string,
    timestamp:number,
    status:RecordingItemStatus,
    uploadProgress?:number,
    processingProgress?:number,
    type: RecordingType


}


export type RecordingServerProgressUpdate={
    uploadingProgress:number,
    processingProgress:number,
    status:"uploading"|"processing"|"done"
}