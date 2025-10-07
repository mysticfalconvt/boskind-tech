import React from 'react';
import { BeadCell as BeadCellType } from '@/types/ironingBeads';

interface BeadCellProps {
  cell: BeadCellType;
  x: number;
  y: number;
  isHovered: boolean;
  isFocused?: boolean;
  previewColor?: string | null;
  onClick: (x: number, y: number) => void;
  onMouseDown: (x: number, y: number) => void;
  onMouseEnter: (x: number, y: number) => void;
  onMouseUp: () => void;
}

export const BeadCell: React.FC<BeadCellProps> = React.memo(({
  cell,
  x,
  y,
  isHovered,
  isFocused = false,
  previewColor,
  onClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}) => {
  const displayColor = previewColor || cell.color;
  const isEmpty = cell.isEmpty && !previewColor;

  return (
    <div
      className={`
        relative w-full h-full border cursor-pointer
        transition-all duration-150 ease-in-out
        ${isFocused ? 'border-primary border-2 shadow-md' : 'border-base-300'}
        ${isHovered && !isFocused ? 'border-base-content/50 shadow-sm' : ''}
        ${isEmpty ? 'bg-base-200 hover:bg-base-300' : ''}
      `}
      onClick={() => onClick(x, y)}
      onMouseDown={() => onMouseDown(x, y)}
      onMouseEnter={() => onMouseEnter(x, y)}
      onMouseUp={onMouseUp}
      role="gridcell"
      aria-label={`Bead at position ${x}, ${y}${displayColor ? `, color ${displayColor}` : ', empty'}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(x, y);
        }
      }}
    >
      {!isEmpty && (
        <div
          className="absolute inset-0 rounded-full border-2 border-opacity-20"
          style={{
            backgroundColor: displayColor || '#transparent',
            borderColor: displayColor || '#transparent',
            boxShadow: displayColor ? `inset 0 0 0 1px ${displayColor}` : 'none',
          }}
        >
          {/* Inner donut hole - made bigger */}
          <div 
            className="absolute rounded-full bg-base-100"
            style={{
              top: '30%',
              left: '30%',
              right: '30%',
              bottom: '30%',
            }}
          />
        </div>
      )}
      
      {/* Preview overlay for hover state */}
      {previewColor && isEmpty && (
        <div
          className="absolute inset-0 rounded-full border-2 border-opacity-40 opacity-70"
          style={{
            backgroundColor: previewColor,
            borderColor: previewColor,
            boxShadow: `inset 0 0 0 1px ${previewColor}`,
          }}
        >
          <div 
            className="absolute rounded-full bg-base-100"
            style={{
              top: '30%',
              left: '30%',
              right: '30%',
              bottom: '30%',
            }}
          />
        </div>
      )}
    </div>
  );
});