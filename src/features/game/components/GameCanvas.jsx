import React from "react";

export default function GameCanvas({ canvasRef }) {
  return (
    <canvas className="canvas" ref={canvasRef} id="canvas"></canvas>
  );
}
