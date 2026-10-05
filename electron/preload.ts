import { contextBridge, ipcRenderer } from 'electron';

const photoBoothApi = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
};

contextBridge.exposeInMainWorld('photoBooth', photoBoothApi);
