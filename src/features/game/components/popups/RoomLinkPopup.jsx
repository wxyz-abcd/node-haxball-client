function RoomLink({link, showPopup}) {
    const copyLink = () => {
        navigator.clipboard.writeText(link)
    }
    return (
        <div className="dialog basic-dialog room-link-view">
            <h1>Room link</h1>
            <p>Use this url to link others directly into this room.</p>
            <input readOnly value={link}></input>
            <div className="buttons">
                <button onClick={()=>showPopup(null)}>Close</button>
                <button onClick={copyLink}>Copy to clipboard</button>
            </div>
        </div>
    )
}

export default RoomLink