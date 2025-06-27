/**
 * Icon Components Index
 * Exports all custom SVG icon web components
 */

// Import all components to register them
import './house-icon.js';
import './shop-icon.js';
import './factory-icon.js';
import './power-icon.js';
import './road-icon.js';
import './bulldozer-icon.js';
import './money-icon.js';
import './population-icon.js';

// Building Icons
export { HouseIcon } from './house-icon.js';
export { ShopIcon } from './shop-icon.js';
export { FactoryIcon } from './factory-icon.js';
export { PowerIcon } from './power-icon.js';
export { RoadIcon } from './road-icon.js';
export { BulldozerIcon } from './bulldozer-icon.js';

// Resource Icons
export { MoneyIcon } from './money-icon.js';
export { PopulationIcon } from './population-icon.js';

// Icon component mapping for building types
export const BUILDING_ICON_COMPONENTS = {
    residential: 'house-icon',
    commercial: 'shop-icon', 
    industrial: 'factory-icon',
    power: 'power-icon',
    road: 'road-icon'
} as const;

// Resource icon component mapping
export const RESOURCE_ICON_COMPONENTS = {
    money: 'money-icon',
    population: 'population-icon',
    power: 'power-icon' // Power uses same icon for both resource and building
} as const;