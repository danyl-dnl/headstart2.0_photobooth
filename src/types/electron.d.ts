export interface PhotoBoothApi {
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    photoBooth: PhotoBoothApi;
  }
}
