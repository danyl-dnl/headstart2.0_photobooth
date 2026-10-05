import type { CapturedPhotoData } from '../../types/photo';
import type { PhotoDeliveryResult, PhotoDeliveryService } from './PhotoDeliveryService';
import { createPhotoFilename } from './createPhotoFilename.ts';
import { getCapturedPhotoValidationError } from '../../types/photoSession';
const mockDeliveryDelayMs = 250;

function failure(error: string): PhotoDeliveryResult {
  return { status: 'failed', error };
}

/** Local-only adapter. It validates and simulates delivery without storing or transmitting the Blob. */
export class MockPhotoDeliveryService implements PhotoDeliveryService {
  async deliver(photo: CapturedPhotoData): Promise<PhotoDeliveryResult> {
    const validationError = getCapturedPhotoValidationError(photo);
    if (validationError) return failure(validationError);

    try {
      await new Promise<void>((resolve) => globalThis.setTimeout(resolve, mockDeliveryDelayMs));
      const filename = createPhotoFilename({ ...photo, mimeType: (photo.blob.type || photo.mimeType).toLowerCase() });
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
