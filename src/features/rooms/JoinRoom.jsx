import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useRoomJoin from "../../hooks/useRoomJoin.jsx";
import Game from "../game/Game.jsx";
import ConnectingState from "./components/ConnectingState.jsx";
import ErrorConnection from "./components/ErrorConnection.jsx";
import Popup from "../../components/Popup.jsx";
import InputDialog from "../../components/InputDialog.jsx";
import Recaptcha from "./Recaptcha.jsx";

export default function JoinRoom() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [cancel, setCancel] = useState(null);
  const [disconnectedMessage, setDisconnectedMessage] = useState(null);
  const [popup, setPopup] = useState(null);
  const cancelRef = useRef(null);
  const { roomRef, loading, connInfo, joinRoom } = useRoomJoin();

  const closePopup = useCallback(() => {
    setPopup(null);
  }, []);

  /** Shows a styled password dialog, returns a Promise<string|null> */
  const askPassword = useCallback(() => {
    return new Promise((resolve) => {
      setPopup({
        component: InputDialog,
        props: {
          title: "Incorrect password",
          message: "The room requires a password. Please try again:",
          placeholder: "Enter password…",
          inputType: "password",
          submitText: "Retry",
          cancelText: "Back",
          onSubmit: (value) => {
            closePopup();
            resolve(value);
          },
          onCancel: () => {
            closePopup();
            resolve(null);
          },
        },
      });
    });
  }, [closePopup]);

  /** Core join logic – can be called recursively on password failure */
  const attemptJoin = useCallback((roomId, password, recaptchaVal) => {
    // ensure any previous pending join is cancelled before attempting a fresh join
    cancelRef.current?.();
    cancelRef.current = null;
    setCancel(null);
    setDisconnectedMessage(null);

    joinRoom({
      id: roomId,
      password,
      recaptchaVal,
      recaptchaFn: () => {
        setPopup({
          component: Recaptcha,
          props: {
            roomData: { roomId },
            onSuccess: (token) => {
              closePopup();
              // cancel any stale join and retry with the token
              cancelRef.current?.();
              attemptJoin(roomId, password, token);
            },
          },
        });
      },
      onOpen: () => {
        setJoined(true)
      },
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
          attemptJoin(roomId, newPassword, null);
        } else {
          setDisconnectedMessage(msg);
        }
      },
    }).then((cancelFn) => {
      // store cancel function both in state and ref for consistent cleanup
      setCancel(() => cancelFn);
      cancelRef.current = cancelFn;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinRoom, askPassword, navigate, closePopup]);

  // cleanup pending join on unmount
  useEffect(() => {
    return () => {
      try { cancelRef.current?.(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    attemptJoin(id, location.state?.password || null, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const popupModal = (
    <Popup
      PopupComponent={popup?.component}
      popupComponentProps={popup?.props}
      closePopup={closePopup}
    />
  );

  // Use early returns (same pattern as original) so only one view shows at a time
  if (loading && connInfo) return (<>{popupModal}<ConnectingState cancel={cancel} connInfo={connInfo} /></>);
  if (disconnectedMessage) return (<>{popupModal}<ErrorConnection message={disconnectedMessage} /></>);
  if (joined) return <>{popupModal}<Game roomRef={roomRef} /></>;

  // Still loading but no connInfo yet, or password popup is showing
  return popupModal;
}
