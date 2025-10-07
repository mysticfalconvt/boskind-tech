import React, { useState, useRef } from 'react';
import { useIroningBeadsStore } from '@/stateHooks/ironingBeadsStore';
import { ERASER_TOOL } from '@/constants/ironingBeads';
import { CustomColorPicker } from './CustomColorPicker';

// Memoized custom color button to prevent unnecessary re-renders
const CustomColorButton = React.memo(({
  color,
  index,
  isSelected,
  onSelect,
  onEdit,
  onRemove
}: {
  color: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}) => {
  return (
    <div className="relative group">
      {/* Main color button */}
      <button
        onClick={onSelect}
        onDoubleClick={onEdit}
        className={`
          relative w-12 h-12 rounded-lg border-2 transition-all duration-200
          hover:scale-105 hover:shadow-md
          ${isSelected
            ? 'border-primary shadow-lg ring-2 ring-primary/30'
            : 'border-base-300 hover:border-base-content/30'
          }
        `}
        style={{ backgroundColor: color }}
        aria-label={`Custom color ${color}`}
        title={`${color} (double-click to edit)`}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </button>

      {/* Edit button - outside main button */}
      <button
        onClick={onEdit}
        className="absolute -top-1 -left-1 w-4 h-4 bg-primary text-primary-content rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs z-10"
        title="Edit custom color"
      >
        ✎
      </button>

      {/* Remove button - outside main button */}
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-4 h-4 bg-error text-error-content rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs z-10"
        title="Remove custom color"
      >
        ×
      </button>
    </div>
  );
});

export const ColorPalette: React.FC = () => {
  const { colorPalette, customColors, selectedTool, setSelectedTool, addCustomColor, removeCustomColor, updateCustomColor } = useIroningBeadsStore();
  const [showNewColorPicker, setShowNewColorPicker] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);
  const [editingColor, setEditingColor] = useState<string | null>(null);



  const handleColorSelect = (color: string) => {
    setSelectedTool({ type: 'color', color });
  };

  const handleEraserSelect = () => {
    setSelectedTool(ERASER_TOOL);
  };

  const isColorSelected = (color: string): boolean => {
    return selectedTool.type === 'color' && selectedTool.color === color;
  };

  const isEraserSelected = (): boolean => {
    return selectedTool.type === 'eraser';
  };

  const handleNewColorSelect = (color: string) => {
    addCustomColor(color);
    handleColorSelect(color);
  };

  const handleAddColorClick = () => {
    setShowNewColorPicker(true);
  };

  const handleRemoveCustomColor = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeCustomColor(index);
  };

  const handleEditCustomColor = (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingColor(color);
    setShowEditColorPicker(true);
  };

  const handleEditColorSelect = (newColor: string) => {
    if (editingColor) {
      const index = customColors.indexOf(editingColor);
      if (index !== -1) {
        updateCustomColor(index, newColor);
        handleColorSelect(newColor);
      }
    }
    setEditingColor(null);
  };

  return (
    <div className="w-full max-w-xs bg-base-100 rounded-lg shadow-md p-4 border border-base-300">
      <h3 className="text-lg font-semibold mb-4 text-base-content">Color Palette</h3>

      {/* Eraser Tool */}
      <div className="mb-4">
        <button
          onClick={handleEraserSelect}
          className={`
            btn w-full transition-all duration-200
            ${isEraserSelected()
              ? 'btn-error'
              : 'btn-outline'
            }
          `}
          aria-label="Eraser tool"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Eraser
        </button>
      </div>

      {/* Standard Colors Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {colorPalette.map((color) => (
          <button
            key={color.id}
            onClick={() => handleColorSelect(color.hex)}
            className={`
              relative w-12 h-12 rounded-lg border-2 transition-all duration-200
              hover:scale-105 hover:shadow-md
              ${isColorSelected(color.hex)
                ? 'border-primary shadow-lg ring-2 ring-primary/30'
                : 'border-base-300 hover:border-base-content/30'
              }
            `}
            style={{ backgroundColor: color.hex }}
            aria-label={`${color.name} color`}
            title={color.name}
          >
            {/* Selection indicator */}
            {isColorSelected(color.hex) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {/* Border for light colors */}
            {(color.hex === '#FFFFFF' || color.hex === '#FFFF00' || color.hex === '#ADD8E6') && (
              <div className="absolute inset-0 rounded-lg border border-base-content/20 pointer-events-none" />
            )}
          </button>
        ))}
      </div>

      {/* Custom Colors Section */}
      <div className="border-t border-base-300 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-base-content">Custom Colors</h4>
          <button
            onClick={handleAddColorClick}
            className="btn btn-xs btn-primary"
            title="Add custom color"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>



        {/* Custom Colors Grid */}
        <div className="grid grid-cols-4 gap-2">
          {customColors.map((color, index) => (
            <div key={color} className="relative group">
              {/* Main color button */}
              <button
                onClick={() => handleColorSelect(color)}
                onDoubleClick={(e) => handleEditCustomColor(color, e)}
                className={`
                  relative w-12 h-12 rounded-lg border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-md
                  ${isColorSelected(color)
                    ? 'border-primary shadow-lg ring-2 ring-primary/30'
                    : 'border-base-300 hover:border-base-content/30'
                  }
                `}
                style={{ backgroundColor: color }}
                aria-label={`Custom color ${color}`}
                title={`${color} (double-click to edit)`}
              >
                {/* Selection indicator */}
                {isColorSelected(color) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white drop-shadow-lg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>

              {/* Edit button - outside main button */}
              <button
                onClick={(e) => handleEditCustomColor(color, e)}
                className="absolute -top-1 -left-1 w-4 h-4 bg-primary text-primary-content rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs z-10"
                title="Edit custom color"
              >
                ✎
              </button>

              {/* Remove button - outside main button */}
              <button
                onClick={(e) => handleRemoveCustomColor(index, e)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-error text-error-content rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs z-10"
                title="Remove custom color"
              >
                ×
              </button>


            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 8 - customColors.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-12 h-12 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center opacity-50"
            >
              <svg className="w-4 h-4 text-base-content opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Current Tool Display */}
      <div className="mt-4 p-3 bg-base-200 rounded-lg">
        <div className="text-sm font-medium text-base-content mb-2">Current Tool:</div>
        <div className="flex items-center gap-2">
          {selectedTool.type === 'color' ? (
            <>
              <div
                className="w-6 h-6 rounded border border-base-300"
                style={{ backgroundColor: selectedTool.color }}
              />
              <span className="text-sm text-base-content opacity-80">
                {colorPalette.find(c => c.hex === selectedTool.color)?.name || 'Color'}
              </span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="text-sm text-base-content opacity-80">Eraser</span>
            </>
          )}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <CustomColorPicker
        isOpen={showNewColorPicker}
        onClose={() => setShowNewColorPicker(false)}
        onColorSelect={handleNewColorSelect}
      />

      <CustomColorPicker
        isOpen={showEditColorPicker}
        onClose={() => setShowEditColorPicker(false)}
        onColorSelect={handleEditColorSelect}
        initialColor={editingColor || '#ff0000'}
      />
    </div>
  );
};