# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "vibe-city", a TypeScript-based city builder web game built using only web standards (HTML, CSS, JavaScript). The game features a functional programming architecture with strict TypeScript configuration.

## Project Structure

```
/
├── src/
│   └── game.ts          # Main game logic (TypeScript)
├── dist/                # Compiled JavaScript output
├── index.html           # Main game page
├── styles.css           # Game styling
├── dev-server.js        # Custom development server
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration (extends @tsconfig/strictest)
├── SPECIFICATION.md     # Game design specification
└── README.md           # Project overview
```

## Development Commands

### Essential Commands
- `npm run dev:watch` - **Primary development command**: Build + start TypeScript watch mode + dev server
- `npm run build` - Compile TypeScript to JavaScript
- `npm run typecheck` - Type check without emitting files

### Server Commands
- `npm run dev` - Build once and start server
- `npm start` - Standard start command (build + serve)
- `npm run serve` - Start dev server only (if already built)

### Background Server Commands
- **IMPORTANT**: Always run long-running commands as background processes with output logged to the `log/` directory
- `npm run build && npm run serve > log/dev-server.log 2>&1 &` - Start dev server in background with logging
- `npm run dev:watch > log/dev-watch.log 2>&1 &` - Start dev watch mode in background with logging
- `npm run dev:stop` - Stop all dev processes (server and TypeScript watcher)
- `tail -f log/dev-server.log` - View dev server logs

### Utility Commands
- `npm run watch` - Watch TypeScript files for changes
- `npm run clean` - Remove build output

## Development Workflow

1. **Start Development**: `npm run dev:watch`
   - Builds TypeScript
   - Starts file watcher for auto-recompilation
   - Starts dev server on http://localhost:3000

2. **Make Changes**: Edit files in `src/`
   - TypeScript files automatically recompile
   - Refresh browser to see changes

3. **Type Checking**: The project uses `@tsconfig/strictest` for maximum type safety

## Technical Architecture

### TypeScript Configuration
- **Strictest possible settings** using `@tsconfig/strictest`
- **Target**: ES2022 for modern JavaScript features
- **Output**: `dist/` directory with source maps and declarations

### Code Architecture
- **Functional Programming**: Pure functions, immutable state
- **Type Safety**: Comprehensive interfaces and type definitions
- **No External Dependencies**: Built with web standards only

### Game Structure
- **Grid-based city building**: 20x15 tile grid
- **Resource management**: Money, population, power
- **Building system**: 5 building types with costs and benefits
- **State management**: Functional state updates with immutability

## Key Files

- `src/game.ts`: Main game logic and state management
- `index.html`: Game UI and HTML structure  
- `styles.css`: Complete game styling
- `dev-server.js`: Zero-dependency development server
- `SPECIFICATION.md`: Comprehensive game design document

## Development Notes

- **No external runtime dependencies** - game uses only web standards
- **Custom dev server** built with Node.js built-ins
- **Functional programming paradigm** throughout codebase
- **Comprehensive type safety** with strictest TypeScript settings
- **Browser Testing**: Tests run only in Chrome/Chromium for faster test execution (this is a "for fun" project prioritizing speed over perfect cross-browser support)