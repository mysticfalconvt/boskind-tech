import { ColorPalette } from '@/types/ironingBeads';

// Default grid size for standard bead plates
export const DEFAULT_GRID_SIZE = { width: 29, height: 29 };

// Standard Perler bead colors
export const STANDARD_BEAD_COLORS: ColorPalette[] = [
  { id: 'white', name: 'White', hex: '#FFFFFF', isDefault: true },
  { id: 'black', name: 'Black', hex: '#000000', isDefault: true },
  { id: 'red', name: 'Red', hex: '#FF0000', isDefault: true },
  { id: 'blue', name: 'Blue', hex: '#0000FF', isDefault: true },
  { id: 'green', name: 'Green', hex: '#00FF00', isDefault: true },
  { id: 'yellow', name: 'Yellow', hex: '#FFFF00', isDefault: true },
  { id: 'orange', name: 'Orange', hex: '#FFA500', isDefault: true },
  { id: 'purple', name: 'Purple', hex: '#800080', isDefault: true },
  { id: 'pink', name: 'Pink', hex: '#FFC0CB', isDefault: true },
  { id: 'brown', name: 'Brown', hex: '#A52A2A', isDefault: true },
  { id: 'gray', name: 'Gray', hex: '#808080', isDefault: true },
  { id: 'lightblue', name: 'Light Blue', hex: '#ADD8E6', isDefault: true },
  { id: 'lightgreen', name: 'Light Green', hex: '#90EE90', isDefault: true },
  { id: 'darkblue', name: 'Dark Blue', hex: '#00008B', isDefault: true },
  { id: 'darkgreen', name: 'Dark Green', hex: '#006400', isDefault: true },
  { id: 'darkred', name: 'Dark Red', hex: '#8B0000', isDefault: true },
];

// Local storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'ironing-beads-projects',
  SETTINGS: 'ironing-beads-settings',
  CUSTOM_COLORS: 'ironing-beads-custom-colors',
} as const;

// Default eraser tool
export const ERASER_TOOL = { type: 'eraser' as const };

// Default color tool
export const DEFAULT_COLOR_TOOL = { 
  type: 'color' as const, 
  color: STANDARD_BEAD_COLORS[0].hex 
};