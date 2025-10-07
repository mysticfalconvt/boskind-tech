import React, { useState, useRef, useEffect } from 'react';

interface CustomColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  initialColor?: string;
}

export const CustomColorPicker: React.FC<CustomColorPickerProps> = ({
  isOpen,
  onClose,
  onColorSelect,
  initialColor = '#ff0000'
}) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLInputElement>(null);

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Update selected color when HSL values change
  useEffect(() => {
    const newColor = hslToHex(hue, saturation, lightness);
    setSelectedColor(newColor);
  }, [hue, saturation, lightness]);

  // Parse initial color to HSL
  useEffect(() => {
    if (initialColor && initialColor !== selectedColor) {
      // Simple hex to HSL conversion for initial color
      const hex = initialColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      setHue(Math.round(h * 360));
      setSaturation(Math.round(s * 100));
      setLightness(Math.round(l * 100));
    }
  }, [initialColor]);

  // Draw color picker canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create saturation/lightness gradient
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const s = (x / width) * 100;
        const l = 100 - (y / height) * 100;
        const color = `hsl(${hue}, ${s}%, ${l}%)`;
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw selection indicator
    const x = (saturation / 100) * width;
    const y = (1 - lightness / 100) * height;
    
    ctx.strokeStyle = lightness > 50 ? '#000000' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner circle for better visibility
    ctx.strokeStyle = lightness > 50 ? '#ffffff' : '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.stroke();
  }, [hue, saturation, lightness]);

  const updateColorFromPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, canvas.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, canvas.height));

    const newSaturation = (x / canvas.width) * 100;
    const newLightness = 100 - (y / canvas.height) * 100;

    setSaturation(Math.round(newSaturation));
    setLightness(Math.round(newLightness));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    updateColorFromPosition(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      updateColorFromPosition(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasMouseLeave = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    onColorSelect(selectedColor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 shadow-xl border border-base-300 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-base-content mb-4">Choose Color</h3>
        
        {/* Color preview */}
        <div className="mb-4 flex items-center gap-3">
          <div 
            className="w-16 h-16 rounded-lg border-2 border-base-300"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <div className="text-sm text-base-content opacity-70">Selected Color</div>
            <div className="font-mono text-sm text-base-content">{selectedColor}</div>
          </div>
        </div>

        {/* Saturation/Lightness picker */}
        <div className="mb-4">
          <canvas
            ref={canvasRef}
            width={200}
            height={150}
            className={`border border-base-300 rounded select-none ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>

        {/* Hue slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-base-content mb-2">Hue</label>
          <input
            ref={hueRef}
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
          />
        </div>

        {/* Quick color presets */}
        <div className="mb-4">
          <div className="text-sm font-medium text-base-content mb-2">Quick Colors</div>
          <div className="grid grid-cols-8 gap-1">
            {[
              '#FF0000', '#FF8000', '#FFFF00', '#80FF00', 
              '#00FF00', '#00FF80', '#00FFFF', '#0080FF',
              '#0000FF', '#8000FF', '#FF00FF', '#FF0080',
              '#800000', '#808000', '#008000', '#008080',
              '#000080', '#800080', '#000000', '#808080'
            ].map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-base-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  setSelectedColor(color);
                  onColorSelect(color);
                  onClose();
                }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary"
          >
            Select Color
          </button>
        </div>
      </div>
    </div>
  );
};