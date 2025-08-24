import { useNavigate } from "react-router-dom";

function LeaveRoomPopup({room, showPopup}) {
    const navigate = useNavigate();
    const handleLeave = () => {
        room?.leave();
        navigate('/RoomList')
    }

    return (
        <div className="dialog basic-dialog leave-room-view">
            <h1>Leave room?</h1>
            <p>Are you sure you want to leave the room?</p>
            <div className="buttons">
                <button onClick={()=>showPopup(null)}>Cancel</button>
                <button onClick={handleLeave}><i className="icon-logout"></i>Leave</button>
            </div>
        </div>
    )
}

export default LeaveRoomPopup