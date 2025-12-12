import { useNavigate } from "react-router-dom"

export default function ErrorConnection({message}) {
    const navigate = useNavigate();
    const closeError = () => {
        navigate('/RoomList');
        window.API.Callback.remove("Wheel");
    };

    return (
    <div className="disconnected-view">
        <div className="dialog basic-dialog">
            <h1>Disconnected</h1>
            <p>{message}</p>
            <button onClick={closeError}>Ok</button>
        </div>
    </div>
)
}