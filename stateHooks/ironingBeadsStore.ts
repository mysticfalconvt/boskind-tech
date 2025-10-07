import { create } from 'zustand';
import { 
  BeadProject, 
  BeadCell, 
  IroningBeadsStore, 
  DesignTool 
} from '@/types/ironingBeads';
import { 
  DEFAULT_GRID_SIZE, 
  STANDARD_BEAD_COLORS, 
  STORAGE_KEYS, 
  DEFAULT_COLOR_TOOL 
} from '@/constants/ironingBeads';

// Utility functions for local storage
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    
    // Convert date strings back to Date objects for projects
    if (key === STORAGE_KEYS.PROJECTS && Array.isArray(parsed)) {
      return parsed.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        modifiedAt: new Date(project.modifiedAt),
      })) as T;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
  }
};

// Create empty grid
const createEmptyGrid = (width: number, height: number): BeadCell[][] => {
  return Array(height).fill(null).map(() =>
    Array(width).fill(null).map(() => ({
      color: null,
      isEmpty: true,
    }))
  );
};

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useIroningBeadsStore = create<IroningBeadsStore>((set, get) => ({
  // Initial state
  projects: loadFromStorage(STORAGE_KEYS.PROJECTS, []),
  currentProject: null,
  selectedTool: DEFAULT_COLOR_TOOL,
  colorPalette: STANDARD_BEAD_COLORS,
  customColors: loadFromStorage(STORAGE_KEYS.CUSTOM_COLORS, []),
  gridSize: DEFAULT_GRID_SIZE,
  isDragging: false,

  // Project Management Actions
  createProject: (name: string) => {
    const newProject: BeadProject = {
      id: generateId(),
      name: name.trim() || 'Untitled Project',
      createdAt: new Date(),
      modifiedAt: new Date(),
      gridSize: DEFAULT_GRID_SIZE,
      beadData: createEmptyGrid(DEFAULT_GRID_SIZE.width, DEFAULT_GRID_SIZE.height),
    };

    set((state) => {
      const updatedProjects = [...state.projects, newProject];
      saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
      
      return {
        projects: updatedProjects,
        currentProject: newProject,
      };
    });
  },

  loadProject: (id: string) => {
    const state = get();
    const project = state.projects.find(p => p.id === id);
    
    if (project) {
      set({
        currentProject: project,
        gridSize: project.gridSize,
      });
      
      // Save last project ID to settings
      const settings = loadFromStorage(STORAGE_KEYS.SETTINGS, {
        defaultGridSize: DEFAULT_GRID_SIZE,
        lastProjectId: null,
      });
      saveToStorage(STORAGE_KEYS.SETTINGS, {
        ...settings,
        lastProjectId: id,
      });
    }
  },

  saveProject: () => {
    const state = get();
    if (!state.currentProject) return;

    const updatedProject = {
      ...state.currentProject,
      modifiedAt: new Date(),
    };

    set((currentState) => {
      const updatedProjects = currentState.projects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      );
      
      saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
      
      return {
        projects: updatedProjects,
        currentProject: updatedProject,
      };
    });
  },

  deleteProject: (id: string) => {
    set((state) => {
      const updatedProjects = state.projects.filter(p => p.id !== id);
      saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
      
      // If we're deleting the current project, clear it
      const currentProject = state.currentProject?.id === id ? null : state.currentProject;
      
      return {
        projects: updatedProjects,
        currentProject,
      };
    });
  },

  duplicateProject: (id: string) => {
    const state = get();
    const originalProject = state.projects.find(p => p.id === id);
    
    if (originalProject) {
      const duplicatedProject: BeadProject = {
        ...originalProject,
        id: generateId(),
        name: `${originalProject.name} (Copy)`,
        createdAt: new Date(),
        modifiedAt: new Date(),
        beadData: originalProject.beadData.map(row => 
          row.map(cell => ({ ...cell }))
        ),
      };

      set((currentState) => {
        const updatedProjects = [...currentState.projects, duplicatedProject];
        saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
        
        return {
          projects: updatedProjects,
        };
      });
    }
  },

  // Design Actions
  setBeadColor: (x: number, y: number, color: string | null) => {
    const state = get();
    if (!state.currentProject) return;
    
    // Validate coordinates
    if (x < 0 || x >= state.currentProject.gridSize.width || 
        y < 0 || y >= state.currentProject.gridSize.height) {
      return;
    }

    set((currentState) => {
      if (!currentState.currentProject) return currentState;

      const updatedBeadData = currentState.currentProject.beadData.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (rowIndex === y && colIndex === x) {
            return {
              color,
              isEmpty: color === null,
            };
          }
          return cell;
        })
      );

      const updatedProject = {
        ...currentState.currentProject,
        beadData: updatedBeadData,
        modifiedAt: new Date(),
      };

      const updatedProjects = currentState.projects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      );

      // Auto-save to storage
      saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);

      return {
        projects: updatedProjects,
        currentProject: updatedProject,
      };
    });
  },

  clearBead: (x: number, y: number) => {
    get().setBeadColor(x, y, null);
  },

  clearGrid: () => {
    const state = get();
    if (!state.currentProject) return;

    const emptyGrid = createEmptyGrid(
      state.currentProject.gridSize.width,
      state.currentProject.gridSize.height
    );

    set((currentState) => {
      if (!currentState.currentProject) return currentState;

      const updatedProject = {
        ...currentState.currentProject,
        beadData: emptyGrid,
        modifiedAt: new Date(),
      };

      const updatedProjects = currentState.projects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      );

      saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);

      return {
        projects: updatedProjects,
        currentProject: updatedProject,
      };
    });
  },

  setSelectedTool: (tool: DesignTool) => {
    set({ selectedTool: tool });
  },

  // Navigation Actions
  clearCurrentProject: () => {
    set({ currentProject: null });
  },

  renameProject: (id: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    set((state) => {
      const updatedProjects = state.projects.map(p =>
        p.id === id ? { ...p, name: trimmedName, modifiedAt: new Date() } : p
      );
      
      saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
      
      // Update current project if it's the one being renamed
      const updatedCurrentProject = state.currentProject?.id === id 
        ? { ...state.currentProject, name: trimmedName, modifiedAt: new Date() }
        : state.currentProject;
      
      return {
        projects: updatedProjects,
        currentProject: updatedCurrentProject,
      };
    });
  },

  // Drag Operations
  startDrag: () => {
    set({ isDragging: true });
  },

  endDrag: () => {
    set({ isDragging: false });
  },

  dragOverCell: (x: number, y: number) => {
    const state = get();
    if (!state.isDragging) return;

    // Apply the current tool to the cell
    if (state.selectedTool.type === 'color' && state.selectedTool.color) {
      state.setBeadColor(x, y, state.selectedTool.color);
    } else if (state.selectedTool.type === 'eraser') {
      state.clearBead(x, y);
    }
  },

  // Custom Colors
  addCustomColor: (color: string) => {
    set((state) => {
      const newCustomColors = [...state.customColors];
      
      // Remove if already exists
      const existingIndex = newCustomColors.indexOf(color);
      if (existingIndex !== -1) {
        newCustomColors.splice(existingIndex, 1);
      }
      
      // Add to beginning (most recent first)
      newCustomColors.unshift(color);
      
      // Keep only last 8 custom colors
      const limitedColors = newCustomColors.slice(0, 8);
      
      saveToStorage(STORAGE_KEYS.CUSTOM_COLORS, limitedColors);
      
      return {
        customColors: limitedColors,
      };
    });
  },

  removeCustomColor: (index: number) => {
    set((state) => {
      const newCustomColors = [...state.customColors];
      newCustomColors.splice(index, 1);
      
      saveToStorage(STORAGE_KEYS.CUSTOM_COLORS, newCustomColors);
      
      return {
        customColors: newCustomColors,
      };
    });
  },

  updateCustomColor: (index: number, newColor: string) => {
    set((state) => {
      const newCustomColors = [...state.customColors];
      newCustomColors[index] = newColor;
      
      saveToStorage(STORAGE_KEYS.CUSTOM_COLORS, newCustomColors);
      
      return {
        customColors: newCustomColors,
      };
    });
  },
}));