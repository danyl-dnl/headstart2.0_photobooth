# Photo Booth

A cross-platform Electron application with a React, TypeScript, and Vite renderer. The project is being built in phases; this first phase establishes the secure desktop application foundation.

## Requirements

- Node.js 20 or newer
- npm

## Development

```sh
npm install
npm run dev
```

This starts the Vite renderer and opens it in Electron with the secure preload bridge enabled.

## Build and run

```sh
npm run build
npm start
```

## Package

```sh
npm run package:mac
npm run package:win
```

The Windows package should be built and validated on Windows before deployment. `electron-builder` is configured for both macOS and Windows targets.

## Architecture

- `electron/main.ts` owns the window lifecycle and IPC handlers.
- `electron/preload.ts` exposes a small, typed API through `contextBridge`.
- `src/` contains the React renderer; it has no direct Node.js access.
- `PROJECT_SPEC.md` is the project source of truth.
