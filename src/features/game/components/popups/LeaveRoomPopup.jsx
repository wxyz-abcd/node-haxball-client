function LeaveRoomPopup({room, showPopup}) {
    return (
        <div className="dialog basic-dialog leave-room-view">
            <h1>Leave room?</h1>
            <p>Are you sure you want to leave the room?</p>
            <div className="buttons">
                <button onClick={()=>showPopup(null)}>Cancel</button>
                <button onClick={()=>room.leave()}><i className="icon-logout"></i>Leave</button>
            </div>
        </div>
    )
}

export default LeaveRoomPopup