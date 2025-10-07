// Core types for the Ironing Beads Designer

export interface BeadProject {
  id: string;
  name: string;
  createdAt: Date;
  modifiedAt: Date;
  gridSize: { width: number; height: number };
  beadData: BeadCell[][];
}

export interface BeadCell {
  color: string | null;
  isEmpty: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  hex: string;
  isDefault: boolean;
}

export interface DesignTool {
  type: 'color' | 'eraser';
  color?: string;
}

export interface IroningBeadsStore {
  // Project Management
  projects: BeadProject[];
  currentProject: BeadProject | null;
  
  // Design State
  selectedTool: DesignTool;
  colorPalette: ColorPalette[];
  customColors: string[];
  gridSize: { width: number; height: number };
  isDragging: boolean;
  
  // Actions
  createProject: (name: string) => void;
  loadProject: (id: string) => void;
  saveProject: () => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  clearCurrentProject: () => void;
  renameProject: (id: string, newName: string) => void;
  
  // Design Actions
  setBeadColor: (x: number, y: number, color: string | null) => void;
  clearBead: (x: number, y: number) => void;
  clearGrid: () => void;
  setSelectedTool: (tool: DesignTool) => void;
  
  // Drag Operations
  startDrag: () => void;
  endDrag: () => void;
  dragOverCell: (x: number, y: number) => void;
  
  // Custom Colors
  addCustomColor: (color: string) => void;
  removeCustomColor: (index: number) => void;
  updateCustomColor: (index: number, newColor: string) => void;
}

export interface StorageSchema {
  'ironing-beads-projects': BeadProject[];
  'ironing-beads-settings': {
    defaultGridSize: { width: number; height: number };
    lastProjectId: string | null;
  };
}