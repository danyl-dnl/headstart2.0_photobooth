import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const currentDirectory = path.dirname(__filename);
const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);
let boothWindow: BrowserWindow | null = null;

function registerIpcHandlers(): void {
  ipcMain.handle('app:get-version', () => app.getVersion());
}

function preventRendererEscape(window: BrowserWindow, productionUrl: string): void {
  window.webContents.on('will-navigate', (event, targetUrl) => {
    const devServerOrigin = process.env.VITE_DEV_SERVER_URL
      ? new URL(process.env.VITE_DEV_SERVER_URL).origin
      : '';
    const isAllowedDevelopmentNavigation = isDevelopment && new URL(targetUrl).origin === devServerOrigin;
    if (targetUrl !== productionUrl && !isAllowedDevelopmentNavigation) event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (isDevelopment) return;

  window.webContents.on('devtools-opened', () => window.webContents.closeDevTools());
  window.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const hasCommand = process.platform === 'darwin' ? input.meta : input.control;
    const exitShortcut = (hasCommand && key === 'q')
      || (hasCommand && key === 'w')
      || (input.alt && key === 'f4');
    const devtoolsShortcut = key === 'f12'
      || ((input.control || input.meta) && input.shift && key === 'i');

    if (exitShortcut || devtoolsShortcut) event.preventDefault();
  });
}

function createWindow(): void {
  const rendererPath = path.resolve(currentDirectory, '../../dist/index.html');
  const productionUrl = pathToFileURL(rendererPath).href;
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    resizable: isDevelopment,
    fullscreen: !isDevelopment,
    kiosk: !isDevelopment,
    autoHideMenuBar: !isDevelopment,
    backgroundColor: '#f5f2ed',
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });
  boothWindow = window;

  preventRendererEscape(window, productionUrl);

  window.on('close', (event) => {
    if (!isDevelopment) event.preventDefault();
  });
  window.on('closed', () => {
    if (boothWindow === window) boothWindow = null;
  });

  const developmentUrl = process.env.VITE_DEV_SERVER_URL;
  if (developmentUrl) {
    void window.loadURL(developmentUrl);
  } else {
    void window.loadFile(rendererPath);
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();

  if (!isDevelopment) Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', (event) => {
  if (!isDevelopment && boothWindow && !boothWindow.isDestroyed()) event.preventDefault();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isDevelopment) app.quit();
});
