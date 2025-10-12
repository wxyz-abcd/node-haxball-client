import React from "react";

export default React.memo(function Popup({ PopupComponent, popupComponentProps = {}, closePopup, classes = "" }) {
    if (!PopupComponent) return <></>;
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        zIndex: 1000
      }}>
        <PopupComponent {...popupComponentProps} onClose={closePopup} />
      </div>
    );
})
