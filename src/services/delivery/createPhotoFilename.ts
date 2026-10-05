import type { CapturedPhotoData } from '../../types/photo';

let filenameSequence = 0;

/** Builds an identifiable, filesystem-safe name without including guest data. */
export function createPhotoFilename(photo: Pick<CapturedPhotoData, 'capturedAt' | 'mimeType'>): string {
  const timestamp = new Date(photo.capturedAt)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .replace(/\.\d{3}Z$/, 'Z');
  const extension = photo.mimeType.toLowerCase() === 'image/png' ? 'png' : 'jpg';
  const uniqueId = globalThis.crypto.randomUUID().slice(0, 8);
  filenameSequence += 1;

  return `headstart_${timestamp}_${uniqueId}_${filenameSequence.toString(36)}.${extension}`;
}
