import { MockPhotoDeliveryService } from './MockPhotoDeliveryService';
import type { PhotoDeliveryService } from './PhotoDeliveryService';

// Select the destination adapter in this composition module; React depends only on the interface.
// Replace with a configured destination adapter only after event infrastructure is confirmed.
export const photoDeliveryService: PhotoDeliveryService = new MockPhotoDeliveryService();
