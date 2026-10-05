# Headstart 2.0 Photo Booth

A cross-platform Electron photo booth for Excel 2026, built with React, TypeScript, and Vite. Development and production window behavior are intentionally different: development remains a normal desktop window, while production starts in fullscreen kiosk mode.

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

`npm start` builds the app and launches the production kiosk window. Production blocks common quit and DevTools shortcuts, external navigation, new windows, and accidental window closing. To stop a production test run, use the operating system's process controls. Development (`npm run dev`) remains resizable and debuggable.

## Package

```sh
npm run package:mac
npm run package:win
```

The Windows package should be built and validated on Windows before deployment. `electron-builder` is configured for both macOS and Windows targets. Fullscreen/kiosk behavior is enabled in production on both platforms; final Windows camera, display-resolution, and operator-exit procedures still require testing on the event hardware.

## Architecture

- `electron/main.ts` owns the window lifecycle and IPC handlers.
- `electron/preload.ts` exposes a small, typed API through `contextBridge`.
- `src/` contains the React renderer; it has no direct Node.js access.
- `src/services/delivery/PhotoDeliveryService.ts` defines the destination-neutral photo delivery interface.
- `src/composition/photoStrip.ts` owns the three fixed reference slots and draws both the progressive preview and final 532×1600 JPEG composition.
- `src/services/delivery/MockPhotoDeliveryService.ts` validates the composed in-memory image and simulates local delivery. It does not write or transmit the image.
- `src/services/delivery/index.ts` selects the current adapter. Replace the mock there when actual event delivery requirements are known.
- `PROJECT_SPEC.md` is the project source of truth.

## Photo delivery status

The photo strip captures three separate frames and draws them into the branded vertical output layout. The same canvas drawing function is used for the live progressive layout, final preview, and delivered JPEG Blob. Real FTP is **not configured**; there are no server addresses or credentials, and the mock does not connect to a server or permanently store photos. A failed attempt leaves the composition available in Preview to retry.

When event infrastructure is confirmed, determine the protocol and destination, add a separate delivery adapter, then validate it on the Windows booth and against the actual server or printer workflow. FTP is only one possible destination; no protocol is assumed yet.

Run the lightweight delivery tests with:

```sh
npm run test:delivery
```

## Event readiness / operator recovery

### Normal operation

Start the booth, let each guest complete the capture and delivery flow, then use **Start again** before the next guest. The next session starts without the previous guest's temporary photo.

### Camera failure

Use **Retry** on the camera screen. This releases any prior stream and requests a new camera stream. If the camera remains unavailable, restart the application.

### Persistent failure and production exit

The production window intentionally has no in-app exit control and blocks normal window closing and common quit shortcuts. Stop it using the operating system's process controls, then relaunch the booth. This application-level behavior is verified from the Electron configuration; the exact operator steps depend on the event computer and have not been verified on Windows. Development mode remains resizable and can be stopped from its launching terminal.

### Verification status

Automated checks and any local development runtime checks are reported per release. Windows camera hardware, event display resolutions, and the production Windows kiosk exit procedure remain platform-dependent until tested on the event machine.
