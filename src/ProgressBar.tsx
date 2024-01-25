import { Component } from "react"

type ProgressBar_props = {
    ratio:number
}
type ProgressBar_state = {
    ratio:number
}
/**
 * 
 */
export class ProgressBar extends Component<ProgressBar_props, ProgressBar_state>{
    constructor(props:Readonly<ProgressBar_props>) {
        super(props)
        this.state = {
            ratio: props.ratio||0.3
        }
    }
    render() {
        return (
            <div className="uploading-progress">

              <div className="progress-info">
              </div>
              <div className="progress-outer">
                <div style={{width:`${this.props.ratio*100}%`}} className="progress-fill"></div>
              </div>
            </div>
        )
    }
}