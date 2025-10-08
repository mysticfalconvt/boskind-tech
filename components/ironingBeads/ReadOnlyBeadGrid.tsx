import React from 'react';
import { BeadProject } from '@/types/ironingBeads';

interface ReadOnlyBeadGridProps {
  project: BeadProject;
}

export const ReadOnlyBeadGrid: React.FC<ReadOnlyBeadGridProps> = ({ project }) => {
  const { beadData, gridSize } = project;

  return (
    <div className="flex flex-col items-center">
      <div 
        className="grid gap-0 border-2 border-base-300 bg-base-100"
        style={{
          gridTemplateColumns: `repeat(${gridSize.width}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize.height}, 1fr)`,
          width: 'fit-content',
          maxWidth: '80vw',
          maxHeight: '80vh',
        }}
      >
        {beadData.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className="w-4 h-4 border border-base-300 border-opacity-30"
              style={{
                backgroundColor: cell.isEmpty ? 'transparent' : (cell.color || 'transparent'),
                minWidth: '4px',
                minHeight: '4px',
              }}
              title={`${x}, ${y}: ${cell.color || 'Empty'}`}
            />
          ))
        )}
      </div>
      
      <div className="mt-4 text-sm text-base-content opacity-60 text-center">
        {gridSize.width} × {gridSize.height} grid
      </div>
    </div>
  );
};