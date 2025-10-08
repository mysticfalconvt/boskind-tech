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

// User and authentication types
interface User {
  id: string;
  username: string;
  createdAt?: string;
}

// Extended store interface with authentication
interface ExtendedIroningBeadsStore extends IroningBeadsStore {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  
  // Authentication actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  // Updated project actions to work with API
  loadProjects: () => Promise<void>;
  
  // Project visibility controls
  toggleProjectVisibility: (id: string, isPublic: boolean) => Promise<void>;
  
  // Public project discovery
  publicProjects: BeadProject[];
  searchFilters: {
    query: string;
    creator: string;
    gridSize: string;
  };
  loadPublicProjects: () => Promise<void>;
  searchPublicProjects: (filters: { query?: string; creator?: string; gridSize?: string }) => Promise<void>;
  duplicatePublicProject: (id: string) => Promise<BeadProject>;
}

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

// API utility functions
const getAuthHeaders = (): Record<string, string> => {
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
  return sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {};
};

const apiCall = async (url: string, options: RequestInit = {}) => {
  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
};

export const useIroningBeadsStore = create<ExtendedIroningBeadsStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  selectedTool: DEFAULT_COLOR_TOOL,
  colorPalette: STANDARD_BEAD_COLORS,
  customColors: loadFromStorage(STORAGE_KEYS.CUSTOM_COLORS, []),
  gridSize: DEFAULT_GRID_SIZE,
  isDragging: false,
  isBatchingUpdates: false,
  
  // Authentication state
  user: null,
  isAuthenticated: false,
  authLoading: true,

  // Public projects state
  publicProjects: [],
  searchFilters: {
    query: '',
    creator: '',
    gridSize: '',
  },

  // Authentication Actions
  login: async (username: string, password: string) => {
    try {
      set({ authLoading: true });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session in localStorage
      if (data.sessionId) {
        localStorage.setItem('session', data.sessionId);
      }

      set({
        user: data.user,
        isAuthenticated: true,
        authLoading: false,
      });

      // Load user's projects after login
      await get().loadProjects();
    } catch (error) {
      set({ authLoading: false });
      throw error;
    }
  },

  register: async (username: string, password: string) => {
    try {
      set({ authLoading: true });
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store session in localStorage
      if (data.sessionId) {
        localStorage.setItem('session', data.sessionId);
      }

      set({
        user: data.user,
        isAuthenticated: true,
        authLoading: false,
      });

      // Load user's projects after registration
      await get().loadProjects();
    } catch (error) {
      set({ authLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem('session');
      
      set({
        user: null,
        isAuthenticated: false,
        projects: [],
        currentProject: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  checkAuth: async () => {
    try {
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) {
        set({ isAuthenticated: false, authLoading: false });
        return;
      }

      const data = await apiCall('/api/auth/me');
      
      set({
        user: data.user,
        isAuthenticated: true,
        authLoading: false,
      });

      // Load user's projects
      await get().loadProjects();
    } catch (error) {
      localStorage.removeItem('session');
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
      });
    }
  },

  // Load projects from API
  loadProjects: async () => {
    try {
      const state = get();
      if (!state.isAuthenticated) return;

      const projects = await apiCall('/api/projects');
      
      // Convert date strings back to Date objects and transform API format to client format
      const processedProjects = projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        modifiedAt: new Date(project.updatedAt),
        beadData: project.gridData,
        gridSize: { width: project.gridWidth, height: project.gridHeight },
      }));

      set({ projects: processedProjects });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  },

  // Project Management Actions (updated to use API)
  createProject: async (name: string) => {
    try {
      const state = get();
      if (!state.isAuthenticated) {
        throw new Error('Must be logged in to create projects');
      }

      const emptyGrid = createEmptyGrid(DEFAULT_GRID_SIZE.width, DEFAULT_GRID_SIZE.height);
      
      const newProject = await apiCall('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim() || 'Untitled Project',
          gridData: emptyGrid,
          gridWidth: DEFAULT_GRID_SIZE.width,
          gridHeight: DEFAULT_GRID_SIZE.height,
        }),
      });

      // Convert dates
      const processedProject = {
        ...newProject,
        createdAt: new Date(newProject.createdAt),
        modifiedAt: new Date(newProject.updatedAt),
        beadData: newProject.gridData,
        gridSize: { width: newProject.gridWidth, height: newProject.gridHeight },
      };

      set((currentState) => ({
        projects: [...currentState.projects, processedProject],
        currentProject: processedProject,
      }));
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  loadProject: (id: string) => {
    const state = get();
    const project = state.projects.find(p => p.id === id);
    
    if (project) {
      set({
        currentProject: project,
        gridSize: project.gridSize,
      });
    }
  },

  saveProject: async () => {
    try {
      const state = get();
      if (!state.currentProject || !state.isAuthenticated) return Promise.resolve();

      const updatedProject = await apiCall(`/api/projects/${state.currentProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: state.currentProject.name,
          gridData: state.currentProject.beadData,
          gridWidth: state.currentProject.gridSize.width,
          gridHeight: state.currentProject.gridSize.height,
        }),
      });

      // Update local state
      const processedProject = {
        ...updatedProject,
        createdAt: new Date(updatedProject.createdAt),
        modifiedAt: new Date(updatedProject.updatedAt),
        beadData: updatedProject.gridData,
        gridSize: { width: updatedProject.gridWidth, height: updatedProject.gridHeight },
      };

      set((currentState) => ({
        projects: currentState.projects.map(p =>
          p.id === processedProject.id ? processedProject : p
        ),
        currentProject: processedProject,
      }));
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    try {
      const state = get();
      if (!state.isAuthenticated) return;

      await apiCall(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      set((currentState) => ({
        projects: currentState.projects.filter(p => p.id !== id),
        currentProject: currentState.currentProject?.id === id ? null : currentState.currentProject,
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  duplicateProject: async (id: string) => {
    try {
      const state = get();
      const originalProject = state.projects.find(p => p.id === id);
      
      if (!originalProject || !state.isAuthenticated) return;

      const duplicatedProject = await apiCall('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: `${originalProject.name} (Copy)`,
          gridData: originalProject.beadData,
          gridWidth: originalProject.gridSize.width,
          gridHeight: originalProject.gridSize.height,
        }),
      });

      // Process the new project
      const processedProject = {
        ...duplicatedProject,
        createdAt: new Date(duplicatedProject.createdAt),
        modifiedAt: new Date(duplicatedProject.updatedAt),
        beadData: duplicatedProject.gridData,
        gridSize: { width: duplicatedProject.gridWidth, height: duplicatedProject.gridHeight },
      };

      set((currentState) => ({
        projects: [...currentState.projects, processedProject],
      }));
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      throw error;
    }
  },

  // Project visibility controls
  toggleProjectVisibility: async (id: string, isPublic: boolean) => {
    try {
      const state = get();
      if (!state.isAuthenticated) return;

      const updatedProject = await apiCall(`/api/projects/${id}/visibility`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic }),
      });

      // Update local state
      const processedProject = {
        ...updatedProject,
        createdAt: new Date(updatedProject.createdAt),
        modifiedAt: new Date(updatedProject.updatedAt),
        beadData: updatedProject.gridData,
        gridSize: { width: updatedProject.gridWidth, height: updatedProject.gridHeight },
      };

      set((currentState) => ({
        projects: currentState.projects.map(p =>
          p.id === processedProject.id ? processedProject : p
        ),
        currentProject: currentState.currentProject?.id === id ? processedProject : currentState.currentProject,
      }));
    } catch (error) {
      console.error('Failed to toggle project visibility:', error);
      throw error;
    }
  },

  // Public project discovery
  loadPublicProjects: async () => {
    try {
      const projects = await apiCall('/api/projects/public');
      
      // Convert date strings back to Date objects and transform API format to client format
      const processedProjects = projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        modifiedAt: new Date(project.updatedAt),
        beadData: project.gridData,
        gridSize: { width: project.gridWidth, height: project.gridHeight },
        username: project.creator?.username || 'Anonymous',
      }));

      set({ publicProjects: processedProjects });
    } catch (error) {
      console.error('Failed to load public projects:', error);
      throw error;
    }
  },

  searchPublicProjects: async (filters: { query?: string; creator?: string; gridSize?: string }) => {
    try {
      const searchParams = new URLSearchParams();
      if (filters.query) searchParams.append('q', filters.query);
      if (filters.creator) searchParams.append('creator', filters.creator);
      if (filters.gridSize) searchParams.append('gridSize', filters.gridSize);

      const url = `/api/projects/public${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const projects = await apiCall(url);
      
      // Convert date strings back to Date objects and transform API format to client format
      const processedProjects = projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        modifiedAt: new Date(project.updatedAt),
        beadData: project.gridData,
        gridSize: { width: project.gridWidth, height: project.gridHeight },
        username: project.creator?.username || 'Anonymous',
      }));

      set({ 
        publicProjects: processedProjects,
        searchFilters: {
          query: filters.query || '',
          creator: filters.creator || '',
          gridSize: filters.gridSize || '',
        }
      });
    } catch (error) {
      console.error('Failed to search public projects:', error);
      throw error;
    }
  },

  duplicatePublicProject: async (id: string) => {
    try {
      const state = get();
      if (!state.isAuthenticated) {
        throw new Error('Must be logged in to duplicate projects');
      }

      const duplicatedProject = await apiCall(`/api/projects/duplicate/${id}`, {
        method: 'POST',
      });

      // Process the new project
      const processedProject = {
        ...duplicatedProject,
        createdAt: new Date(duplicatedProject.createdAt),
        modifiedAt: new Date(duplicatedProject.updatedAt),
        beadData: duplicatedProject.gridData,
        gridSize: { width: duplicatedProject.gridWidth, height: duplicatedProject.gridHeight },
      };

      set((currentState) => ({
        projects: [...currentState.projects, processedProject],
      }));

      return processedProject;
    } catch (error) {
      console.error('Failed to duplicate public project:', error);
      throw error;
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

      // Auto-save to API (async) - but not during batch updates
      if (!currentState.isBatchingUpdates) {
        setTimeout(() => {
          get().saveProject().catch(console.error);
        }, 500); // Debounce auto-save
      }

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

      // Auto-save to API (async)
      setTimeout(() => {
        get().saveProject().catch(console.error);
      }, 500); // Debounce auto-save

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
      
      // Auto-save to API (async)
      setTimeout(() => {
        get().saveProject().catch(console.error);
      }, 500); // Debounce auto-save
      
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
    set({ isDragging: true, isBatchingUpdates: true });
  },

  endDrag: () => {
    set({ isDragging: false, isBatchingUpdates: false });
    // Trigger auto-save after drag ends
    setTimeout(() => {
      get().saveProject().catch(console.error);
    }, 100); // Short delay to ensure state is updated
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