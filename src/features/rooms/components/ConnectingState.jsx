import { useNavigate } from "react-router-dom"

export default function ConnectingState({ connInfo, cancel }) {
    const navigate = useNavigate();
    const cancelFunc = () => {
        cancel?.();
        navigate('/RoomList');
        window.API.Callback.remove("Wheel");
    }

    return <div className={`connecting-view`}>
      <div className="dialog">
        <h1>Connecting</h1>
        <div className={`connecting-view-log`}>
          {connInfo?.split(',').map((info, index) =>
            <p key={index}>{info}</p>
          )}
        </div>
        <button onClick={cancelFunc}>Cancel</button>
      </div>
    </div>
}