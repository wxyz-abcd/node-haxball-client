import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useRoomJoin from "../../hooks/useRoomJoin.jsx";
import Game from "../game/Game.jsx";
import ConnectingState from "./components/ConnectingState.jsx";
import ErrorConnection from "./components/ErrorConnection.jsx";
import Popup from "../../components/Popup.jsx";
import InputDialog from "../../components/InputDialog.jsx";

export default function JoinRoom() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [cancel, setCancel] = useState(null);
  const [disconnectedMessage, setDisconnectedMessage] = useState(null);
  const { roomRef, loading, connInfo, joinRoom } = useRoomJoin();

  // Popup state for password re-prompt
  const [popupComponent, setPopupComponent] = useState(null);
  const [popupProps, setPopupProps] = useState({});
  const closePopup = useCallback(() => {
    setPopupComponent(null);
    setPopupProps({});
  }, []);

  /** Shows a styled password dialog, returns a Promise<string|null> */
  const askPassword = useCallback(() => {
    return new Promise((resolve) => {
      setPopupProps({
        title: "Incorrect password",
        message: "The room requires a password. Please try again:",
        placeholder: "Enter password…",
        inputType: "password",
        submitText: "Retry",
        cancelText: "Back",
        onSubmit: (value) => {
          setPopupComponent(null);
          setPopupProps({});
          resolve(value);
        },
        onCancel: () => {
          setPopupComponent(null);
          setPopupProps({});
          resolve(null);
        },
      });
      setPopupComponent(() => InputDialog);
    });
  }, []);

  /** Core join logic – can be called recursively on password failure */
  const attemptJoin = useCallback((roomId, password) => {
    setDisconnectedMessage(null);

    joinRoom({
      id: roomId,
      password,
      onOpen: () => setJoined(true),
      onClose: async (err) => {
        const msg = err?.toString?.() ?? String(err);
        const isPasswordError =
          /password/i.test(msg) || /wrong/i.test(msg) || /incorrect/i.test(msg);

        if (isPasswordError) {
          const newPassword = await askPassword();
          if (newPassword === null) {
            navigate("/RoomList");
            return;
          }
          attemptJoin(roomId, newPassword);
        } else {
          setDisconnectedMessage(msg);
        }
      },
    }).then((cancelFn) => {
      setCancel(() => cancelFn);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinRoom, askPassword, navigate]);

  useEffect(() => {
    if (!id) return;
    attemptJoin(id, location.state?.password || null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Password re-prompt popup (always rendered on top)
  const popup = (
    <Popup
      PopupComponent={popupComponent}
      popupComponentProps={popupProps}
      closePopup={closePopup}
    />
  );

  // Use early returns (same pattern as original) so only one view shows at a time
  if (loading && connInfo) return (<>{popup}<ConnectingState cancel={cancel} connInfo={connInfo} /></>);
  if (disconnectedMessage) return (<>{popup}<ErrorConnection message={disconnectedMessage} /></>);
  if (joined) return <>{popup}<Game roomRef={roomRef} /></>;

  // Still loading but no connInfo yet, or password popup is showing
  return popup;
}
