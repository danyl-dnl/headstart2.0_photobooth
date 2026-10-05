/** In-memory image data produced by the camera, before a preview URL is assigned. */
export type CapturedPhotoData = {
  blob: Blob;
  capturedAt: number;
  mimeType: string;
  width: number;
  height: number;
};

/** A temporary photo owned by the current booth session. */
export type CapturedPhoto = CapturedPhotoData & {
  objectUrl: string;
};

export type PhotoSession = {
  photo: CapturedPhoto | null;
  isPhotoSelected: boolean;
};
