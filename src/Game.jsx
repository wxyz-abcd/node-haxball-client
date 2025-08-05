import { useEffect, useRef, useState } from "react";
import defaultRenderer from "./assets/renderer/defaultRenderer";
import './assets/canvas.css';
import grass from './assets/images/grass.png';
import concrete from './assets/images/concrete.png';
import concrete2 from './assets/images/concrete2.png';
import typing from './assets/images/typing.png';

function Game({ roomId }) {
    const { Room, Utils, ConnectionState } = window.API;
    const [joined, setJoined] = useState('Not joined');
    const [connState, setConnState] = useState('');
    const canvasRef = useRef(null);
    useEffect(() => {
        const init = async () => {
            if (!canvasRef.current) {
                console.error("Canvas reference is not set.");
                return;
            };
            const canvas = canvasRef.current;
            const defaultRendererObj = new defaultRenderer(window.API, {canvas: canvas,paintGame: true,images: { grass, concrete, concrete2, typing }})
            const authObj = await Utils.generateAuth();

            const jParams = {
                id: 'PqpMb-NOBwI',
                password: null,
                token: null,
                authObj: authObj[1],
            };

            const storage = {
                player_name: "test",
                avatar: "xx",
                player_auth_key: authObj[0],
            };

            Room.join(jParams, {
                storage: storage,
                noPluginMechanism: true,
                renderer: null,
                onOpen: (room) => {
                    room.setRenderer(defaultRendererObj);
                    setJoined('Joined room: ' + room.name);
                },
                onConnInfo: (state) => {
                    let stateText = '';
                    switch (state) {
                        case ConnectionState.TryingReverseConnection:
                            stateText += 'Trying reverse connection...';
                            break;
                        case ConnectionState.ConnectingToMaster:
                            stateText += 'Connecting to master...';
                            break;
                        case ConnectionState.ConnectingToPeer:
                            stateText += 'Connecting to peer...';
                            break;
                        case ConnectionState.AwaitingState:
                            stateText += 'Awaiting state...';
                            break;
                        case ConnectionState.Active:
                            stateText += 'Connection active';
                            break;
                        case ConnectionState.ConnectionFailed:
                            stateText += 'Connection failed';
                            break;
                    }
                    setConnState(stateText);
                },
            });
        }
        init();
    }, [ConnectionState.Active, ConnectionState.AwaitingState, ConnectionState.ConnectingToMaster, ConnectionState.ConnectingToPeer, ConnectionState.ConnectionFailed, ConnectionState.TryingReverseConnection, Room, Utils]);

    return (<>
        <canvas className="canvas" ref={canvasRef} id="canvas"></canvas>
        <div>{joined}</div>
        <div>{connState}</div>
    </>);
}

export default Game;