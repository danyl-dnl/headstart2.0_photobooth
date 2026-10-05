import type { CapturedPhotoData, PhotoSession } from './photo';

const supportedMimeTypes = new Set(['image/jpeg', 'image/png']);

export function createEmptyPhotoSession(): PhotoSession {
  return { photos: [] };
}

export const maxSessionPhotos = 3;

export function appendPhoto(session: PhotoSession, photo: CapturedPhotoData & { id: string; objectUrl: string }): PhotoSession {
  if (session.photos.length >= maxSessionPhotos || session.photos.some((item) => item.id === photo.id)) return session;
  return { photos: [...session.photos, photo] };
}

/** Replaces a frame in place so later captures remain assigned to their original slots. */
export function replacePhoto(session: PhotoSession, photoId: string, photo: CapturedPhotoData & { id: string; objectUrl: string }): PhotoSession {
  if (!session.photos.some((item) => item.id === photoId)) return session;
  return { photos: session.photos.map((item) => item.id === photoId ? { ...photo, id: photoId } : item) };
}

/** Shared validation boundary for photo session entry and delivery. */
export function getCapturedPhotoValidationError(photo: unknown): string | null {
  if (!photo || typeof photo !== 'object') return 'No captured photo was provided.';
  const capturedPhoto = photo as CapturedPhotoData;
  if (!(capturedPhoto.blob instanceof Blob) || capturedPhoto.blob.size === 0) return 'The captured photo is empty.';
  if (typeof capturedPhoto.mimeType !== 'string') return 'The captured photo metadata is invalid.';

  const mimeType = capturedPhoto.mimeType.toLowerCase();
  if (!supportedMimeTypes.has(mimeType)) return 'The captured photo format is unsupported.';
  if (capturedPhoto.blob.type && capturedPhoto.blob.type.toLowerCase() !== mimeType) return 'The captured photo metadata is invalid.';
  if (!Number.isFinite(capturedPhoto.capturedAt) || capturedPhoto.capturedAt <= 0 || !Number.isFinite(new Date(capturedPhoto.capturedAt).getTime())) return 'The captured photo metadata is invalid.';
  if (!Number.isSafeInteger(capturedPhoto.width) || capturedPhoto.width <= 0) return 'The captured photo metadata is invalid.';
  if (!Number.isSafeInteger(capturedPhoto.height) || capturedPhoto.height <= 0) return 'The captured photo metadata is invalid.';

  return null;
}

export function isValidCapturedPhotoData(photo: unknown): boolean {
  return getCapturedPhotoValidationError(photo) === null;
}
