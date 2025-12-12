import React from "react";

export default React.memo(function GameCanvas({ canvasRef }) {
  return (
    <canvas tabIndex={-1} className="canvas" ref={canvasRef} id="canvas"></canvas>
  );
});
