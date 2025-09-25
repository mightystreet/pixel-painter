import React, { useRef, useEffect } from "react";

function GridCanvas({
  canvasRef,
  canvasSize,
  cellSize,
  zoom,
  offset,
  pixels,
  colorMode,
  drag,
  timeLeft,
  hoveredCell,
  confirmFlicker,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onWheel,
}) {

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.save();
    ctx.scale(zoom, zoom);
    
    // Proper modulo function that handles negative numbers correctly
    const mod = (n, m) => ((n % m) + m) % m;
    
    ctx.translate(-mod(offset.x / zoom, cellSize), -mod(offset.y / zoom, cellSize));
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1 / zoom;
    const cols = Math.ceil(canvasSize / (cellSize * zoom)) + 2;
    const rows = Math.ceil(canvasSize / (cellSize * zoom)) + 2;
    const startCol = Math.floor(offset.x / (cellSize * zoom));
    const startRow = Math.floor(offset.y / (cellSize * zoom));
    const colored = new Set();
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const px = startCol + i;
        const py = startRow + j;
        const key = `${px},${py}`;
        if (pixels[key]) {
          const pixelData = pixels[key];
          const pixelColor = typeof pixelData === 'string' ? pixelData : pixelData.color;
          ctx.fillStyle = pixelColor;
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          colored.add(key);
        }
      }
    }
    // Flickering confirm square
    if (confirmFlicker && confirmFlicker.col != null && confirmFlicker.row != null) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = confirmFlicker.color;
      ctx.fillRect(
        (confirmFlicker.col - startCol) * cellSize,
        (confirmFlicker.row - startRow) * cellSize,
        cellSize,
        cellSize
      );
      ctx.restore();
    }
    // Highlight hovered cell if set
    if (hoveredCell && hoveredCell.col != null && hoveredCell.row != null) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#ffe066";
      ctx.lineWidth = 3 / zoom;
      ctx.strokeRect(
        (hoveredCell.col - startCol) * cellSize,
        (hoveredCell.row - startRow) * cellSize,
        cellSize,
        cellSize
      );
      ctx.restore();
    }
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1 / zoom;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const px = startCol + i;
        const py = startRow + j;
        const key = `${px},${py}`;
        if (!colored.has(key)) {
          ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
    ctx.restore();
  }, [canvasRef, offset, cellSize, canvasSize, pixels, zoom, hoveredCell]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
  style={{ width: "90vmin", height: "90vmin", maxWidth: "100vw", maxHeight: "100vh", display: "block", cursor: colorMode ? "crosshair" : (drag ? "grabbing" : "grab") }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onWheel={onWheel}
    />
  );
}

export default GridCanvas;
