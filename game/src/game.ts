// Import icon components
import './components/index.js';

// Type definitions
interface Resources {
    money: number;
    population: number;
    power: number;
}

interface BuildingType {
    icon: string;
    cost: number;
    provides: Partial<Resources>;
    requires: Partial<Resources>;
}

interface BuildingTypes {
    residential: BuildingType;
    commercial: BuildingType;
    industrial: BuildingType;
    power: BuildingType;
    road: BuildingType;
}

interface GridCell {
    type: 'empty' | keyof BuildingTypes;
    building: BuildingType | null;
    element: HTMLElement;
    landValue?: number; // Land value 0-10
}

interface GameState {
    grid: GridCell[][];
    selectedBuilding: keyof BuildingTypes | null;
    bulldozeMode: boolean;
    resources: Resources;
    showLandValues: boolean;
}

interface GridConfig {
    width: number;
    height: number;
}

interface BuildingPlacementResult {
    success: boolean;
    grid?: GridCell[][];
    resources?: Resources;
    message?: string;
}

interface DemolishResult {
    success: boolean;
    grid?: GridCell[][];
    resources?: Resources;
    refund?: number;
}

// Constants
const GRID_CONFIG: GridConfig = {
    width: 20,
    height: 15
};

const BUILDING_TYPES: BuildingTypes = {
    residential: {
        icon: '<house-icon></house-icon>',
        cost: 500,
        provides: { population: 4 },
        requires: { power: 1 }
    },
    commercial: {
        icon: '<shop-icon></shop-icon>',
        cost: 1000,
        provides: { money: 100 },
        requires: { power: 2, population: 2 }
    },
    industrial: {
        icon: '<factory-icon></factory-icon>',
        cost: 2000,
        provides: { money: 200 },
        requires: { power: 3 }
    },
    power: {
        icon: '<power-icon></power-icon>',
        cost: 5000,
        provides: { power: 10 },
        requires: {}
    },
    road: {
        icon: '<road-icon></road-icon>',
        cost: 100,
        provides: {},
        requires: {}
    }
};

const INITIAL_STATE: GameState = {
    grid: [],
    selectedBuilding: null,
    bulldozeMode: false,
    resources: {
        money: 10000,
        population: 0,
        power: 0
    },
    showLandValues: false // Not used anymore, always show
};

// Game state
let gameState: GameState = { ...INITIAL_STATE };

// Type guards and utility functions
const isValidGridPosition = (x: number, y: number): boolean => {
    return y >= 0 && y < GRID_CONFIG.height && x >= 0 && x < GRID_CONFIG.width;
};

const getGridCell = (grid: GridCell[][], x: number, y: number): GridCell | null => {
    if (!isValidGridPosition(x, y)) return null;
    const row = grid[y];
    return row ? row[x] || null : null;
};

// Pure functions for state management
const createEmptyGrid = (width: number, height: number): GridCell[][] => {
    const grid: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
        const row: GridCell[] = [];
        for (let x = 0; x < width; x++) {
            // Element will be set during DOM creation
            row.push({
                type: 'empty',
                building: null,
                element: document.createElement('div'), // Temporary element
                landValue: 5 // Base land value
            });
        }
        grid.push(row);
    }
    return grid;
};

const updateResources = (grid: GridCell[][]): Resources => {
    const newResources: Resources = {
        money: gameState.resources.money,
        population: 0,
        power: 0
    };
    
    grid.flat().forEach((cell: GridCell) => {
        if (cell.building?.provides) {
            Object.entries(cell.building.provides).forEach(([resource, amount]) => {
                if (amount !== undefined && resource in newResources) {
                    if (resource === 'money') newResources.money += amount;
                    else if (resource === 'population') newResources.population += amount;
                    else if (resource === 'power') newResources.power += amount;
                }
            });
        }
    });
    
    return newResources;
};

const canPlaceBuilding = (cell: GridCell, buildingType: keyof BuildingTypes, resources: Resources): boolean => {
    if (cell.type !== 'empty') return false;
    
    const building = BUILDING_TYPES[buildingType];
    const adjustedCost = getAdjustedCost(building.cost, cell.landValue || 5);
    if (resources.money < adjustedCost) return false;
    
    return true;
};

const placeBuilding = (
    grid: GridCell[][], 
    x: number, 
    y: number, 
    buildingType: keyof BuildingTypes, 
    resources: Resources
): BuildingPlacementResult => {
    const cell = getGridCell(grid, x, y);
    if (!cell) {
        return { success: false, message: 'Invalid position!' };
    }
    
    const building = BUILDING_TYPES[buildingType];
    
    if (!canPlaceBuilding(cell, buildingType, resources)) {
        return { 
            success: false, 
            message: cell.type !== 'empty' ? 'Cannot build here!' : 'Not enough money!' 
        };
    }
    
    const newGrid: GridCell[][] = grid.map(row => [...row]);
    const newCell = getGridCell(newGrid, x, y);
    if (!newCell) {
        return { success: false, message: 'Invalid position!' };
    }
    
    newCell.type = buildingType;
    newCell.building = { ...building };
    
    const adjustedCost = getAdjustedCost(building.cost, newCell.landValue || 5);
    const updatedResources = updateResources(newGrid);
    updatedResources.money = resources.money - adjustedCost;
    
    // Update land values after placing building
    const gridWithUpdatedValues = updateAllLandValues(newGrid);
    
    return { 
        success: true, 
        grid: gridWithUpdatedValues, 
        resources: updatedResources
    };
};

const demolishBuilding = (grid: GridCell[][], x: number, y: number, resources: Resources): DemolishResult => {
    const cell = getGridCell(grid, x, y);
    if (!cell) {
        return { success: false };
    }
    
    if (cell.type === 'empty') {
        return { success: false };
    }
    
    const refund = Math.floor((cell.building?.cost || 0) * 0.5);
    const newGrid: GridCell[][] = grid.map(row => [...row]);
    const newCell = getGridCell(newGrid, x, y);
    if (!newCell) {
        return { success: false };
    }
    
    newCell.type = 'empty';
    newCell.building = null;
    
    const updatedResources = updateResources(newGrid);
    updatedResources.money = resources.money + refund;
    
    // Update land values after demolishing building
    const gridWithUpdatedValues = updateAllLandValues(newGrid);
    
    return { 
        success: true, 
        grid: gridWithUpdatedValues, 
        resources: updatedResources,
        refund
    };
};

const selectBuilding = (currentState: GameState, buildingType: keyof BuildingTypes): GameState => ({
    ...currentState,
    selectedBuilding: buildingType,
    bulldozeMode: false
});

const toggleBulldozeMode = (currentState: GameState): GameState => ({
    ...currentState,
    bulldozeMode: !currentState.bulldozeMode,
    selectedBuilding: null
});

// Land value calculation functions
const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2)); // Chebyshev distance
};

const getBuildingInfluence = (buildingType: keyof BuildingTypes): { value: number; radius: number } => {
    switch (buildingType) {
        case 'commercial': return { value: 2, radius: 1 };
        case 'industrial': return { value: -1, radius: 1 };
        case 'power': return { value: -2, radius: 2 };
        case 'road': return { value: 1, radius: 1 };
        case 'residential': return { value: 0, radius: 0 };
        default: return { value: 0, radius: 0 };
    }
};

const calculateLandValue = (grid: GridCell[][], targetX: number, targetY: number): number => {
    let landValue = 5; // Base value
    
    // Check influence from all buildings
    for (let y = 0; y < grid.length; y++) {
        const row = grid[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
            const cell = grid[y]?.[x];
            if (cell && cell.type !== 'empty' && cell.building) {
                const influence = getBuildingInfluence(cell.type);
                const distance = calculateDistance(x, y, targetX, targetY);
                
                if (distance <= influence.radius && distance > 0) {
                    // Apply full effect within the radius for all buildings
                    // No distance decay - buildings affect all tiles in their radius equally
                    landValue += influence.value;
                }
            }
        }
    }
    
    // Clamp between 0 and 10
    return Math.max(0, Math.min(10, Math.round(landValue)));
};

const updateAllLandValues = (grid: GridCell[][]): GridCell[][] => {
    const newGrid = grid.map(row => [...row]);
    
    for (let y = 0; y < newGrid.length; y++) {
        const row = newGrid[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
            const cell = newGrid[y]?.[x];
            if (cell) {
                cell.landValue = calculateLandValue(newGrid, x, y);
            }
        }
    }
    
    return newGrid;
};

// Cost adjustment based on land value
const getAdjustedCost = (baseCost: number, landValue: number): number => {
    // Increase cost by 10-50% based on land value (0-10 scale)
    // Land value 5 = no adjustment, 0-4 = cheaper, 6-10 = more expensive
    const multiplier = 1 + ((landValue - 5) * 0.1); // Each point = 10% change
    return Math.round(baseCost * Math.max(0.5, Math.min(1.5, multiplier)));
};

// UI update functions
const updateResourceDisplay = (resources: Resources): void => {
    const moneyElement = document.getElementById('money');
    const populationElement = document.getElementById('population');
    const powerElement = document.getElementById('power');
    
    if (moneyElement) moneyElement.textContent = resources.money.toLocaleString();
    if (populationElement) populationElement.textContent = resources.population.toString();
    if (powerElement) powerElement.textContent = resources.power.toString();
};

const updateCursor = (gameState: GameState): void => {
    const gameArea = document.querySelector('.game-area') as HTMLElement;
    if (!gameArea) return;
    
    if (gameState.bulldozeMode) {
        gameArea.style.cursor = 'crosshair';
    } else if (gameState.selectedBuilding) {
        gameArea.style.cursor = 'pointer';
    } else {
        gameArea.style.cursor = 'default';
    }
};

const updateButtonStates = (gameState: GameState): void => {
    document.querySelectorAll('.building-btn').forEach((btn: Element) => {
        btn.classList.remove('selected');
    });
    
    const bulldozeBtn = document.getElementById('bulldoze-btn');
    if (bulldozeBtn) bulldozeBtn.classList.remove('selected');
    
    if (gameState.selectedBuilding) {
        const selectedBtn = document.querySelector(`[data-building="${gameState.selectedBuilding}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }
    
    if (gameState.bulldozeMode && bulldozeBtn) {
        bulldozeBtn.classList.add('selected');
    }
};

const updateCellElement = (cell: GridCell): void => {
    cell.element.className = 'grid-cell';
    
    // Clear any existing land value classes
    for (let i = 0; i <= 10; i++) {
        cell.element.classList.remove(`land-value-${i}`, `land-value-border-${i}`);
    }
    
    if (cell.type !== 'empty') {
        // Show building icon
        const buildingIcon = cell.building ? cell.building.icon : '';
        
        // Always show land value overlay on occupied tiles
        if (cell.landValue !== undefined) {
            cell.element.innerHTML = `${buildingIcon}<span class="land-value-overlay">${cell.landValue}</span>`;
            cell.element.classList.add(`land-value-border-${cell.landValue}`);
        } else {
            cell.element.innerHTML = buildingIcon;
        }
        
        if (cell.type === 'road') {
            cell.element.classList.add('road');
        } else {
            cell.element.classList.add('building', cell.type);
        }
    } else {
        // For empty tiles, always show land value
        if (cell.landValue !== undefined) {
            cell.element.innerHTML = `<span class="land-value land-value-${cell.landValue}">${cell.landValue}</span>`;
            cell.element.classList.add(`land-value-${cell.landValue}`);
        } else {
            cell.element.innerHTML = '';
        }
    }
};

const updateGridDisplay = (grid: GridCell[][]): void => {
    grid.flat().forEach(cell => updateCellElement(cell));
};

const updateTileInfo = (gameState: GameState, x: number, y: number): void => {
    const cell = getGridCell(gameState.grid, x, y);
    const tileInfo = document.getElementById('tile-info');
    if (!tileInfo || !cell) return;
    
    if (cell.type === 'empty') {
        if (gameState.selectedBuilding) {
            const building = BUILDING_TYPES[gameState.selectedBuilding];
            const adjustedCost = getAdjustedCost(building.cost, cell.landValue || 5);
            const landValueText = cell.landValue !== undefined ? `Land Value: ${cell.landValue}<br>` : '';
            tileInfo.innerHTML = `
                <strong>Place ${gameState.selectedBuilding}</strong><br>
                ${landValueText}Cost: $${adjustedCost}<br>
                ${adjustedCost !== building.cost ? `(Base: $${building.cost})<br>` : ''}
                ${Object.keys(building.provides).length > 0 ? 
                    'Provides: ' + Object.entries(building.provides)
                        .map(([k, v]) => `${k} +${v}`)
                        .join(', ') : 'No production'}
            `;
        } else if (gameState.bulldozeMode) {
            tileInfo.innerHTML = '<strong>Bulldoze Mode</strong><br>Click to demolish buildings';
        } else {
            tileInfo.innerHTML = `<strong>Empty Land</strong><br>Position: (${x}, ${y})<br>Select a building to place here`;
        }
    } else {
        const building = cell.building;
        if (building) {
            tileInfo.innerHTML = `
                <strong>${cell.type.charAt(0).toUpperCase() + cell.type.slice(1)} ${building.icon}</strong><br>
                Position: (${x}, ${y})<br>
                Original Cost: $${building.cost}<br>
                ${Object.keys(building.provides).length > 0 ? 
                    'Provides: ' + Object.entries(building.provides)
                        .map(([k, v]) => `${k} +${v}`)
                        .join(', ') : 'No production'}
            `;
        }
    }
};

const showMessage = (message: string): void => {
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 1000;
        font-weight: bold;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
        }
    }, 2000);
};

// Event handlers
const handleCellClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    // Find the grid cell (might be the target itself or a parent)
    const gridCell = target.closest('.grid-cell') as HTMLElement;
    if (!gridCell) return;
    
    const xAttr = gridCell.getAttribute('data-x');
    const yAttr = gridCell.getAttribute('data-y');
    
    if (!xAttr || !yAttr) return;
    
    const x = parseInt(xAttr, 10);
    const y = parseInt(yAttr, 10);
    
    if (gameState.bulldozeMode) {
        const result = demolishBuilding(gameState.grid, x, y, gameState.resources);
        if (result.success && result.grid && result.resources) {
            gameState.grid = result.grid;
            gameState.resources = result.resources;
            // Update all cells since land values changed
            updateGridDisplay(gameState.grid);
            updateResourceDisplay(gameState.resources);
            if (result.refund !== undefined) {
                showMessage(`Demolished! Refund: $${result.refund}`);
            }
        }
    } else if (gameState.selectedBuilding) {
        const result = placeBuilding(gameState.grid, x, y, gameState.selectedBuilding, gameState.resources);
        if (result.success && result.grid && result.resources) {
            gameState.grid = result.grid;
            gameState.resources = result.resources;
            // Update all cells since land values changed
            updateGridDisplay(gameState.grid);
            updateResourceDisplay(gameState.resources);
        } else if (result.message) {
            showMessage(result.message);
        }
    }
    
    updateTileInfo(gameState, x, y);
};

const handleCellHover = (e: Event): void => {
    const target = e.target as HTMLElement;
    // Find the grid cell (might be the target itself or a parent)
    const gridCell = target.closest('.grid-cell') as HTMLElement;
    if (!gridCell) return;
    
    const xAttr = gridCell.getAttribute('data-x');
    const yAttr = gridCell.getAttribute('data-y');
    
    if (!xAttr || !yAttr) return;
    
    const x = parseInt(xAttr, 10);
    const y = parseInt(yAttr, 10);
    updateTileInfo(gameState, x, y);
};

const handleBuildingSelect = (buildingType: keyof BuildingTypes): void => {
    gameState = selectBuilding(gameState, buildingType);
    updateButtonStates(gameState);
    updateCursor(gameState);
};

const handleBulldozeToggle = (): void => {
    gameState = toggleBulldozeMode(gameState);
    updateButtonStates(gameState);
    updateCursor(gameState);
};

// Grid creation
const createGrid = (): void => {
    const gridContainer = document.getElementById('city-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    gameState.grid = createEmptyGrid(GRID_CONFIG.width, GRID_CONFIG.height);
    
    for (let y = 0; y < GRID_CONFIG.height; y++) {
        for (let x = 0; x < GRID_CONFIG.width; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.setAttribute('data-x', x.toString());
            cell.setAttribute('data-y', y.toString());
            
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('mouseenter', handleCellHover);
            
            gridContainer.appendChild(cell);
            
            const gridCell = getGridCell(gameState.grid, x, y);
            if (gridCell) {
                gridCell.element = cell;
                updateCellElement(gridCell);
            }
        }
    }
};

const setupEventListeners = (): void => {
    const buildingButtons = document.querySelectorAll('.building-btn');
    buildingButtons.forEach((button: Element) => {
        const buildingBtn = button as HTMLElement;
        const buildingType = buildingBtn.getAttribute('data-building') as keyof BuildingTypes;
        if (buildingType && buildingType in BUILDING_TYPES) {
            button.addEventListener('click', () => {
                handleBuildingSelect(buildingType);
            });
        }
    });
    
    const bulldozeBtn = document.getElementById('bulldoze-btn');
    if (bulldozeBtn) {
        bulldozeBtn.addEventListener('click', handleBulldozeToggle);
    }
};

// Game initialization
const initGame = (): void => {
    gameState = { ...INITIAL_STATE };
    createGrid();
    // Initialize land values and update display
    gameState.grid = updateAllLandValues(gameState.grid);
    updateGridDisplay(gameState.grid);
    setupEventListeners();
    updateResourceDisplay(gameState.resources);
};

// Initialize the game when DOM and web components are ready
const initializeWhenReady = async (): Promise<void> => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    
    // Wait a bit for web components to register
    await new Promise(resolve => setTimeout(resolve, 100));
    
    initGame();
    
    // Land values are always visible now
    
    // Expose gameState for test debugging
    (window as any).gameState = gameState;
};

initializeWhenReady();