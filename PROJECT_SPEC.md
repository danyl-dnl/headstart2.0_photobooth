# Photo Booth Application — Project Specification

## 1. Project Overview

Build a simple, professional photo booth application designed primarily for deployment on Windows, while allowing development and testing on macOS.

The application will eventually run on a computer connected to:

* A webcam or USB camera
* A physical photo printer
* A local/network connection for transferring photos

The application should provide a simple photo booth experience:

```text
Start
  ↓
Camera Preview
  ↓
Countdown
  ↓
Capture
  ↓
Photo Preview
  ↓
Retake / Use Photo
  ↓
Future: Send to Printer
```

The initial development focuses only on the camera and photo-capture workflow.

FTP and printer integration will be implemented later after the exact printer requirements are known.

---

# 2. Target Platforms

## Development Platform

Primary development environment:

* macOS

The application must be fully developable and testable on macOS.

The Mac's built-in webcam can be used during development.

## Deployment Platform

Primary production environment:

* Windows 10/11

The final application should be distributable as a Windows desktop application.

The architecture must avoid unnecessary operating-system-specific dependencies so that the same codebase can be used for both platforms.

---

# 3. Technology Stack

Use:

* Electron
* React
* TypeScript
* Vite
* Node.js
* CSS
* electron-builder

Use native browser APIs wherever practical.

Avoid adding large frameworks or unnecessary dependencies.

---

# 4. Application Architecture

Use Electron's standard secure architecture:

```text
Electron
│
├── Main Process
│   ├── Application lifecycle
│   ├── Filesystem operations
│   ├── Photo storage
│   ├── FTP service (future)
│   ├── Printer service (future)
│   └── IPC handlers
│
├── Preload
│   └── Secure API bridge
│
└── Renderer Process
    └── React + TypeScript
        ├── UI
        ├── Camera preview
        ├── Countdown
        ├── Photo capture
        └── Photo review
```

## Security

Do not expose Node.js or Electron APIs directly to the React renderer.

Use:

* `contextIsolation: true`
* `nodeIntegration: false`
* Preload script
* Explicit IPC/API methods

Only expose the minimum functionality required by the renderer.

---

# 5. Renderer Responsibilities

React should be responsible primarily for:

* UI
* User interaction
* Camera preview
* Countdown display
* Photo preview
* Application state

React components should NOT directly contain:

* FTP implementation
* Printer implementation
* Raw filesystem operations
* Platform-specific code
* Sensitive configuration

---

# 6. Main Process Responsibilities

The Electron main process should handle functionality that requires privileged desktop access.

Examples:

* Filesystem operations
* Application directories
* Future FTP communication
* Future printer integration
* Secure configuration
* Platform-specific functionality
* IPC communication

Keep these responsibilities separated into services/modules.

---

# 7. Preload Layer

Use the preload process as a controlled bridge between the renderer and Electron main process.

Expose only specific APIs.

Conceptually:

```text
Renderer
   ↓
window.photoBooth
   ↓
Preload
   ↓
IPC
   ↓
Main Process
```

Do not expose unrestricted Electron APIs.

---

# 8. Cross-Platform Rules

The application must work on both macOS and Windows.

Avoid hard-coded paths such as:

```text
C:\Users\...
/Users/...
```

Use Electron/Node platform-independent path utilities such as:

```text
path.join()
app.getPath()
```

Use application-specific directories provided by Electron where appropriate.

Do not assume:

* Windows drive letters
* macOS directory structure
* Windows-only environment variables
* macOS-only commands

Platform-specific code should be isolated in dedicated modules.

---

# 9. Camera

The application should use the browser's standard camera APIs where possible.

Use:

```text
navigator.mediaDevices.getUserMedia()
```

for webcam access.

The camera implementation should work with:

* Mac built-in webcam
* USB webcam on macOS
* USB webcam on Windows

Do not hard-code a specific camera device.

---

# 10. Camera Permission Handling

Handle permission states gracefully.

Possible situations:

### Permission granted

Start the camera normally.

### Permission denied

Show a clear message explaining that camera access is required.

Provide a retry/recovery action where possible.

### No camera detected

Show:

```text
Camera not found.

Please connect a camera and try again.
```

### Camera initialization failure

Do not crash the application.

Show an appropriate error and allow the user to retry.

---

# 11. Camera Lifecycle

The application should properly manage the camera stream.

When the camera screen opens:

```text
Initialize camera
↓
Request camera access
↓
Start video stream
```

When leaving the camera screen:

```text
Stop video tracks
↓
Release camera
```

Avoid keeping the webcam active unnecessarily.

---

# 12. Photo Booth Flow

## Welcome Screen

Example:

```text
PHOTO BOOTH

Ready to take your photo?

[ START ]
```

Pressing Start opens the camera.

---

## Camera Screen

Display:

* Large live camera preview
* Capture button
* Minimal controls

Example:

```text
┌──────────────────────────────┐
│                              │
│       CAMERA PREVIEW         │
│                              │
│                              │
└──────────────────────────────┘

          [ TAKE PHOTO ]
```

---

# 13. Countdown

When Capture is pressed:

```text
3
2
1
```

Then capture the current frame.

The countdown should be:

* Large
* Highly visible
* Easy to understand
* Suitable for a photo booth

The countdown duration should eventually be configurable.

---

# 14. Photo Capture

Capture the current video frame using Canvas.

The captured image should:

* Maintain the appropriate aspect ratio
* Use a sensible resolution
* Be converted to JPEG or PNG
* Be temporarily stored
* Be available for preview

The camera should not automatically upload the photo.

---

# 15. Photo Preview

After capture:

```text
┌──────────────────────────────┐
│                              │
│        CAPTURED PHOTO        │
│                              │
└──────────────────────────────┘

[ RETAKE ]       [ USE PHOTO ]
```

### Retake

Return to the camera screen.

### Use Photo

Move to the confirmation/success state.

---

# 16. Photo Storage

Create a dedicated photo-management layer.

The renderer should not directly manipulate filesystem paths.

Conceptually:

```text
Camera
 ↓
Captured Image
 ↓
Photo Manager
 ↓
Temporary Photo
```

Use platform-independent paths.

The exact permanent storage strategy can be finalized later.

---

# 17. Future Printer Architecture

Printer functionality must be isolated from camera functionality.

Future flow:

```text
Captured Photo
      ↓
Photo Manager
      ↓
Printer Service
      ↓
FTP Service
      ↓
Printer
```

Potential modules:

```text
PhotoService
PrinterService
FTPService
```

For the initial implementation, these services can be placeholders.

Do NOT implement FTP yet.

---

# 18. FTP Requirements — Future

The eventual FTP configuration may include:

```text
FTP host
FTP port
FTP username
FTP password
Remote directory
Transfer mode
Connection timeout
Retry count
```

These values must NOT be hard-coded into the application.

They should eventually come from a secure/configurable configuration system.

Do not assume the final FTP protocol or printer behavior until the printer documentation is provided.

---

# 19. Printer Requirements — Future

The printer may eventually require:

```text
Photo upload
Print command
Print queue
Print status
Retry handling
Failure handling
```

Do not assume that uploading a photo via FTP automatically means printing it.

The exact workflow must be determined from the actual printer.

---

# 20. UI Design

The application should look like a professional commercial photo booth.

Characteristics:

* Minimal
* Clean
* Modern
* Professional
* Touch-friendly
* Large controls
* Clear typography
* Strong visual hierarchy

Avoid:

* AI-themed UI
* Neon effects
* Hacker aesthetics
* Excessive gradients
* Excessive animations
* Developer dashboards
* Technical terminology in the user interface
* Unnecessary configuration screens

The user should feel like they are using a dedicated photo booth.

---

# 21. Fullscreen / Kiosk

The production Windows application should eventually support:

* Fullscreen
* Kiosk-style operation
* Preventing accidental access to the desktop
* Optional automatic startup

These features do not need to be implemented during the initial camera MVP.

The architecture should not prevent adding them later.

---

# 22. Project Structure

Use a clean structure similar to:

```text
photo-booth/
│
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   └── services/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── camera/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── styles/
│
├── public/
│
├── PROJECT_SPEC.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── ...
```

The exact structure may be adjusted if the chosen Electron/Vite setup has a better conventional structure.

Do not create unnecessary abstraction purely to match this example.

---

# 23. Development Phases

## Phase 1 — Foundation

* Electron
* React
* TypeScript
* Vite
* Secure preload
* IPC foundation
* Development scripts
* macOS development

Goal:

A working Electron application running on macOS.

---

## Phase 2 — UI

Build:

* Welcome screen
* Camera screen
* Preview screen
* Success screen

---

## Phase 3 — Camera

Implement:

* Camera permissions
* Webcam detection
* Live preview
* Camera lifecycle
* Error handling

Test using the Mac webcam.

---

## Phase 4 — Capture

Implement:

* Countdown
* Canvas capture
* Image conversion
* Temporary storage

---

## Phase 5 — Photo Workflow

Implement:

```text
Start
 ↓
Camera
 ↓
Countdown
 ↓
Capture
 ↓
Preview
 ↓
Retake / Use Photo
```

---

## Phase 6 — Windows Testing

Test on Windows:

* USB camera
* Camera permissions
* Photo capture
* File handling
* Fullscreen
* Kiosk behavior

---

## Phase 7 — FTP / Printer

Only after the printer requirements are available:

* FTP configuration
* FTP connection
* Upload
* Printer workflow
* Status
* Retry
* Error handling

---

# 24. Testing Strategy

The application must be tested progressively.

## macOS

Test:

* Application launch
* Camera permission
* Webcam preview
* Countdown
* Photo capture
* Preview
* Retake
* Use Photo
* File handling

## Windows

Before deployment, test:

* Application launch
* USB webcam
* Camera permission
* Photo capture
* File paths
* Fullscreen
* Kiosk mode
* FTP
* Physical printer

Do not assume that successful macOS testing guarantees successful Windows printer integration.

---

# 25. Current Goal

The immediate goal is ONLY:

```text
Empty folder
    ↓
Electron + React foundation
    ↓
Working application
```

Then:

```text
Start
 ↓
Camera
 ↓
3
 ↓
2
 ↓
1
 ↓
Capture
 ↓
Preview
 ↓
Retake / Use Photo
```

FTP and printer functionality will be added later.

---

# 26. Development Principle

Build the project incrementally.

Do not implement future functionality prematurely.

At every phase:

1. Implement.
2. Run.
3. Test.
4. Fix issues.
5. Confirm the phase works.
6. Move to the next phase.

The application should remain simple, reliable, and easy to extend.
