# Requirements Document

## Introduction

The Ironing Beads Designer is a web-based pixel art creation tool that allows users to design patterns for Perler/ironing beads. Users can create, edit, and save multiple bead designs using a grid-based interface with a color palette. The tool will support standard 29x29 bead plates with the flexibility to extend to other sizes in the future. All designs will be persisted to local storage for easy access across sessions.

## Requirements

### Requirement 1

**User Story:** As a crafter, I want to view and manage multiple bead design projects, so that I can organize and work on different patterns.

#### Acceptance Criteria

1. WHEN the user visits the ironing beads page THEN the system SHALL display a list of all saved projects
2. WHEN no projects exist THEN the system SHALL display an empty state with an option to create a new project
3. WHEN the user clicks "Create New Project" THEN the system SHALL prompt for a project name and create a new 29x29 grid
4. WHEN the user clicks on an existing project THEN the system SHALL load that project's design data
5. WHEN the user creates a project THEN the system SHALL save it to local storage with a unique identifier

### Requirement 2

**User Story:** As a crafter, I want to design bead patterns on a grid, so that I can create pixel art for my ironing bead projects.

#### Acceptance Criteria

1. WHEN a project is loaded THEN the system SHALL display a 29x29 grid of empty bead positions
2. WHEN the user clicks on a grid cell THEN the system SHALL fill that cell with the currently selected color
3. WHEN a grid cell is filled THEN the system SHALL display it as a donut-shaped bead with the selected color
4. WHEN the user has the eraser selected and clicks a filled cell THEN the system SHALL clear that cell
5. WHEN the user clicks and drags across multiple cells THEN the system SHALL apply the selected tool to all cells in the drag path

### Requirement 3

**User Story:** As a crafter, I want to select from a variety of bead colors, so that I can create colorful and detailed designs.

#### Acceptance Criteria

1. WHEN the design interface loads THEN the system SHALL display a color palette sidebar with standard bead colors
2. WHEN the user clicks on a color in the palette THEN the system SHALL set that color as the active drawing tool
3. WHEN the user clicks the eraser tool THEN the system SHALL set the eraser as the active tool
4. WHEN a tool is selected THEN the system SHALL provide visual feedback showing which tool is currently active
5. WHEN the user hovers over the grid with a selected color THEN the system SHALL show a preview of where the bead will be placed

### Requirement 4

**User Story:** As a crafter, I want to save my bead designs, so that I can preserve my work and continue editing later.

#### Acceptance Criteria

1. WHEN the user makes changes to a design THEN the system SHALL automatically save the changes to local storage
2. WHEN the user manually saves a project THEN the system SHALL update the project data in local storage
3. WHEN the user renames a project THEN the system SHALL update the project name in local storage
4. WHEN the user deletes a project THEN the system SHALL remove it from local storage and return to the project list
5. IF local storage is unavailable THEN the system SHALL display a warning message about inability to save

### Requirement 5

**User Story:** As a crafter, I want the interface to be intuitive and responsive, so that I can focus on creating my designs efficiently.

#### Acceptance Criteria

1. WHEN the user interacts with the grid THEN the system SHALL provide immediate visual feedback
2. WHEN the page loads THEN the system SHALL render the interface within 2 seconds
3. WHEN the user switches between projects THEN the system SHALL load the new project within 1 second
4. WHEN the grid is displayed THEN the system SHALL ensure each bead cell is clearly visible and clickable
5. WHEN the user is on a mobile device THEN the system SHALL provide a touch-friendly interface with appropriate sizing

### Requirement 6

**User Story:** As a crafter, I want to easily navigate between the project list and design interface, so that I can manage multiple projects efficiently.

#### Acceptance Criteria

1. WHEN the user is in the design interface THEN the system SHALL provide a "Back to Projects" button
2. WHEN the user clicks "Back to Projects" THEN the system SHALL save current changes and return to the project list
3. WHEN the user is in the project list THEN the system SHALL display project names and creation/modification dates
4. WHEN the user wants to duplicate a project THEN the system SHALL create a copy with a new name
5. WHEN the user confirms project deletion THEN the system SHALL remove the project and show a confirmation message