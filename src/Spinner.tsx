type Spinner_Props = {
  label?: string
}
export function Spinner({ label }: Spinner_Props) {
  return (
    <div className="spinner-and-label">
      {label&&(<span>{label}</span>)}
      <div className="spinner-border" role="status">

      </div>
    </div>

  )

}