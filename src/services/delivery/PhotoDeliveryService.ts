import type { CapturedPhoto } from '../../types/photo';

export type PhotoDeliveryResult =
  | { status: 'success'; deliveryId: string; filename: string }
  | { status: 'failed'; error: string };

/** A destination-neutral boundary for delivering an in-memory captured photo. */
export interface PhotoDeliveryService {
  deliver(photo: CapturedPhoto): Promise<PhotoDeliveryResult>;
}
