import { useState } from "react"

function KickBanPopup({ clickedPlayer, showPopup, room }) {
    const [ban, setBan] = useState(false)
    const [reason, setReason] = useState(null)
    console.log(ban)
    const handleKickButton = () => {
        room.kickPlayer(clickedPlayer.id, reason, ban)
        showPopup(null)
    }
    return (
        <div className="dialog">
            <h1>Kick {clickedPlayer.name}</h1>
            <div className="label-input">
                <label>Reason: </label>
                <input onChange={(e) => setReason(e.target.value)} value={reason} type="text" data-hook="reason" maxLength={100}></input>
            </div>
            <button onClick={()=>setBan(!ban)} data-hook="ban-btn">
                <i className="icon-block">
                    Ban from rejoining:
                </i>
                <span>{ban ? ' Yes' : ' No'}</span>
            </button>
            <div className="row">
                <button onClick={()=>showPopup(null)}>Cancel</button>
                <button onClick={handleKickButton}>Kick</button>
            </div>
        </div>
    )
}

export default KickBanPopup