import type { CapturedPhoto } from '../../types/photo';
import type { PhotoDeliveryResult, PhotoDeliveryService } from './PhotoDeliveryService';
import { createPhotoFilename } from './createPhotoFilename.ts';

const supportedMimeTypes = new Set(['image/jpeg', 'image/png']);
const mockDeliveryDelayMs = 250;

function failure(error: string): PhotoDeliveryResult {
  return { status: 'failed', error };
}

/** Local-only adapter. It validates and simulates delivery without storing or transmitting the Blob. */
export class MockPhotoDeliveryService implements PhotoDeliveryService {
  async deliver(photo: CapturedPhoto): Promise<PhotoDeliveryResult> {
    if (!photo || typeof photo !== 'object') return failure('No captured photo was provided.');

    const blob = photo.blob;
    if (!(blob instanceof Blob) || blob.size === 0) return failure('The captured photo is empty.');

    const mimeType = (blob.type || photo.mimeType).toLowerCase();
    if (!supportedMimeTypes.has(mimeType)) return failure('The captured photo format is unsupported.');

    try {
      await new Promise<void>((resolve) => globalThis.setTimeout(resolve, mockDeliveryDelayMs));
      const filename = createPhotoFilename({ ...photo, mimeType });
      return {
        status: 'success',
        deliveryId: `mock-${globalThis.crypto.randomUUID()}`,
        filename,
      };
    } catch {
      return failure('The photo could not be prepared for delivery.');
    }
  }
}
