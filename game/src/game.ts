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
}

interface GameState {
    grid: GridCell[][];
    selectedBuilding: keyof BuildingTypes | null;
    bulldozeMode: boolean;
    resources: Resources;
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
        icon: '🏠',
        cost: 500,
        provides: { population: 4 },
        requires: { power: 1 }
    },
    commercial: {
        icon: '🏢',
        cost: 1000,
        provides: { money: 100 },
        requires: { power: 2, population: 2 }
    },
    industrial: {
        icon: '🏭',
        cost: 2000,
        provides: { money: 200 },
        requires: { power: 3 }
    },
    power: {
        icon: '⚡',
        cost: 5000,
        provides: { power: 10 },
        requires: {}
    },
    road: {
        icon: '🛣️',
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
    }
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
                element: document.createElement('div') // Temporary element
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
    if (resources.money < building.cost) return false;
    
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
    
    return { 
        success: true, 
        grid: newGrid, 
        resources: updateResources(newGrid)
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
    
    return { 
        success: true, 
        grid: newGrid, 
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
    cell.element.textContent = cell.building ? cell.building.icon : '';
    cell.element.className = 'grid-cell';
    
    if (cell.type !== 'empty') {
        cell.element.classList.add('building');
        if (cell.type === 'road') {
            cell.element.classList.add('road');
        }
    }
};

const updateTileInfo = (gameState: GameState, x: number, y: number): void => {
    const cell = getGridCell(gameState.grid, x, y);
    const tileInfo = document.getElementById('tile-info');
    if (!tileInfo || !cell) return;
    
    if (cell.type === 'empty') {
        if (gameState.selectedBuilding) {
            const building = BUILDING_TYPES[gameState.selectedBuilding];
            tileInfo.innerHTML = `
                <strong>Place ${gameState.selectedBuilding}</strong><br>
                Cost: $${building.cost}<br>
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
    const xAttr = target.getAttribute('data-x');
    const yAttr = target.getAttribute('data-y');
    
    if (!xAttr || !yAttr) return;
    
    const x = parseInt(xAttr, 10);
    const y = parseInt(yAttr, 10);
    
    if (gameState.bulldozeMode) {
        const result = demolishBuilding(gameState.grid, x, y, gameState.resources);
        if (result.success && result.grid && result.resources) {
            gameState.grid = result.grid;
            gameState.resources = result.resources;
            const cell = getGridCell(gameState.grid, x, y);
            if (cell) updateCellElement(cell);
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
            const cell = getGridCell(gameState.grid, x, y);
            if (cell) updateCellElement(cell);
            updateResourceDisplay(gameState.resources);
        } else if (result.message) {
            showMessage(result.message);
        }
    }
    
    updateTileInfo(gameState, x, y);
};

const handleCellHover = (e: Event): void => {
    const target = e.target as HTMLElement;
    const xAttr = target.getAttribute('data-x');
    const yAttr = target.getAttribute('data-y');
    
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
    setupEventListeners();
    updateResourceDisplay(gameState.resources);
};

// Initialize the game
initGame();