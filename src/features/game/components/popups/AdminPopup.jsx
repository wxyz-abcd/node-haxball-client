import KickBanPopup from "./KickBanPopup"

function AdminPopup({ player, clickedPlayer, showPopup, room }) {
    const handleKickClick = () => {
        showPopup(<KickBanPopup clickedPlayer={clickedPlayer} showPopup={showPopup} room={room} />)
    }

    const handleAdmin = () => {
        room.setPlayerAdmin(clickedPlayer.id, !clickedPlayer.isAdmin)
    }

    return (
        <div className="dialog">
            <h1>{clickedPlayer.name}</h1>
            <button onClick={handleAdmin} disabled={!player.isAdmin}>{clickedPlayer.isAdmin ? 'Remove admin' : "Give Admin"}</button>
            <button onClick={handleKickClick} disabled={!player.isAdmin}>Kick</button>
            <button onClick={()=>showPopup(null)}>Close</button>
        </div>
    )
}

export default AdminPopup