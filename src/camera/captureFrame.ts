export class CameraFrameError extends Error {
  constructor() {
    super('The camera frame is not ready to capture.');
    this.name = 'CameraFrameError';
  }
}

export function captureVideoFrame(video: HTMLVideoElement): Promise<Blob> {
  if (
    video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    || video.videoWidth === 0
    || video.videoHeight === 0
  ) {
    return Promise.reject(new CameraFrameError());
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d');

  if (!context) {
    return Promise.reject(new CameraFrameError());
  }

  // The preview is mirrored in CSS only. Drawing the source video directly keeps the saved photo natural.
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new CameraFrameError());
      },
      'image/jpeg',
      0.92,
    );
  });
}
