import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BeadCell } from '@/components/ironingBeads/BeadCell';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';

export const BeadGrid: React.FC = () => {
  const {
    currentProject,
    selectedTool,
    isDragging,
    setBeadColor,
    clearBead,
    startDrag,
    endDrag,
    dragOverCell,
  } = useIroningBeadsStore();

  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-96 bg-base-200 rounded-lg">
        <p className="text-base-content opacity-60">No project selected</p>
      </div>
    );
  }

  const { beadData, gridSize } = currentProject;

  const handleCellClick = useCallback((x: number, y: number) => {
    if (selectedTool.type === 'color' && selectedTool.color) {
      setBeadColor(x, y, selectedTool.color);
    } else if (selectedTool.type === 'eraser') {
      clearBead(x, y);
    }
  }, [selectedTool, setBeadColor, clearBead]);

  const handleMouseDown = useCallback((x: number, y: number) => {
    startDrag();
    handleCellClick(x, y);
  }, [startDrag, handleCellClick]);

  const handleMouseEnter = useCallback((x: number, y: number) => {
    setHoveredCell({ x, y });
    if (isDragging) {
      dragOverCell(x, y);
    }
  }, [isDragging, dragOverCell]);

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { x, y } = focusedCell;
    let newX = x;
    let newY = y;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newY = Math.max(0, y - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newY = Math.min(gridSize.height - 1, y + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newX = Math.max(0, x - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newX = Math.min(gridSize.width - 1, x + 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleCellClick(x, y);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        clearBead(x, y);
        break;
      default:
        return;
    }

    if (newX !== x || newY !== y) {
      setFocusedCell({ x: newX, y: newY });
    }
  }, [focusedCell, gridSize, handleCellClick, clearBead]);

  const getPreviewColor = (x: number, y: number): string | null => {
    if (hoveredCell?.x === x && hoveredCell?.y === y) {
      if (selectedTool.type === 'color' && selectedTool.color) {
        return selectedTool.color;
      } else if (selectedTool.type === 'eraser') {
        return null;
      }
    }
    return null;
  };

  // Calculate cell size based on container and grid size
  const cellSize = Math.min(600 / gridSize.width, 600 / gridSize.height);
  const gridWidth = cellSize * gridSize.width;
  const gridHeight = cellSize * gridSize.height;

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 text-sm text-base-content opacity-70">
        Grid: {gridSize.width} × {gridSize.height}
      </div>
      
      <div
        ref={gridRef}
        className="grid gap-0 border-2 border-base-content/30 bg-base-100 select-none focus:outline-none focus:ring-2 focus:ring-primary"
        style={{
          gridTemplateColumns: `repeat(${gridSize.width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize.height}, ${cellSize}px)`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label={`Bead design grid, ${gridSize.width} by ${gridSize.height} cells`}
      >
        {beadData.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}
            >
              <BeadCell
                cell={cell}
                x={x}
                y={y}
                isHovered={hoveredCell?.x === x && hoveredCell?.y === y}
                isFocused={focusedCell.x === x && focusedCell.y === y}
                previewColor={getPreviewColor(x, y)}
                onClick={handleCellClick}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
              />
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-xs text-base-content opacity-60 text-center">
        Click to place beads • Drag to draw • Use eraser to remove<br />
        Arrow keys to navigate • Enter/Space to place • Delete to erase
      </div>
    </div>
  );
};