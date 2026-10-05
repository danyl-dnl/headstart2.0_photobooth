import type { CapturedPhotoData } from '../types/photo';

export type PhotoSlot = Readonly<{ x: number; y: number; width: number; height: number }>;

/** Reference artwork dimensions and deterministic slots are shared by preview and exported output. */
export const PHOTO_STRIP_LAYOUT = Object.freeze({
  width: 532,
  height: 1600,
  background: '#ffffff',
  emptySlot: '#000000',
  slots: [
    { x: 35, y: 213, width: 463, height: 350 },
    { x: 35, y: 626, width: 463, height: 349 },
    { x: 35, y: 1038, width: 463, height: 349 },
  ] as readonly PhotoSlot[],
  logo: { x: 58, y: 1414, width: 128, height: 132 },
  wordmark: { x: 222, baseline: 1508, font: '700 38px Arial, sans-serif' },
});

type CanvasContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect' | 'drawImage' | 'createLinearGradient' | 'fillText' | 'font' | 'textBaseline' | 'letterSpacing'>;
type StripImageSource = HTMLImageElement | ImageBitmap;
export type PhotoStripCanvas = Pick<HTMLCanvasElement, 'width' | 'height' | 'getContext' | 'toBlob'>;
export type BitmapFactory = (blob: Blob) => Promise<ImageBitmap>;

export function drawPhotoStrip(
  context: CanvasContext,
  photos: readonly StripImageSource[],
  logo: StripImageSource,
): void {
  const layout = PHOTO_STRIP_LAYOUT;
  context.fillStyle = layout.background;
  context.fillRect(0, 0, layout.width, layout.height);

  layout.slots.forEach((slot, index) => {
    context.fillStyle = layout.emptySlot;
    context.fillRect(slot.x, slot.y, slot.width, slot.height);
    const photo = photos[index];
    if (photo) drawCover(context, photo, slot);
  });

  context.drawImage(logo, layout.logo.x, layout.logo.y, layout.logo.width, layout.logo.height);
  const gradient = context.createLinearGradient(layout.wordmark.x, 0, layout.width - 40, 0);
  gradient.addColorStop(0, '#a51f32');
  gradient.addColorStop(1, '#e3a3a9');
  context.fillStyle = gradient;
  context.font = layout.wordmark.font;
  context.textBaseline = 'alphabetic';
  context.letterSpacing = '1px';
  context.fillText('EXCEL 2026', layout.wordmark.x, layout.wordmark.baseline);
}

function drawCover(context: CanvasContext, image: StripImageSource, slot: PhotoSlot): void {
  const dimensions = getImageDimensions(image);
  const scale = Math.max(slot.width / dimensions.width, slot.height / dimensions.height);
  const sourceWidth = slot.width / scale;
  const sourceHeight = slot.height / scale;
  const sourceX = (dimensions.width - sourceWidth) / 2;
  const sourceY = (dimensions.height - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, slot.x, slot.y, slot.width, slot.height);
}

function getImageDimensions(image: StripImageSource): { width: number; height: number } {
  if ('naturalWidth' in image) return { width: image.naturalWidth, height: image.naturalHeight };
  return { width: image.width, height: image.height };
}

/** Draws original Blobs into the shared strip layout and returns its full-resolution JPEG Blob. */
export async function composePhotoStrip(
  photos: readonly CapturedPhotoData[],
  logo: StripImageSource,
  options: { canvas?: PhotoStripCanvas; bitmapFactory?: BitmapFactory } = {},
): Promise<Blob> {
  if (photos.length !== PHOTO_STRIP_LAYOUT.slots.length) throw new Error('A finished photo strip needs exactly three photos.');
  const canvas = options.canvas ?? document.createElement('canvas');
  await renderPhotoStrip(canvas, photos, logo, options.bitmapFactory);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The final photo strip could not be encoded.')), 'image/jpeg', 0.94);
  });
}

export async function renderPhotoStrip(
  canvas: PhotoStripCanvas,
  photos: readonly CapturedPhotoData[],
  logo: StripImageSource,
  bitmapFactory?: BitmapFactory,
): Promise<void> {
  canvas.width = PHOTO_STRIP_LAYOUT.width;
  canvas.height = PHOTO_STRIP_LAYOUT.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The photo strip canvas is unavailable.');

  const makeBitmap = bitmapFactory ?? ((blob) => createImageBitmap(blob));
  const results = await Promise.allSettled(photos.map((photo) => makeBitmap(photo.blob)));
  const bitmaps = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  const failedResult = results.find((result) => result.status === 'rejected');
  if (failedResult?.status === 'rejected') {
    bitmaps.forEach((bitmap) => bitmap.close());
    throw failedResult.reason;
  }
  try {
    drawPhotoStrip(context, bitmaps, logo);
  } finally {
    bitmaps.forEach((bitmap) => bitmap.close());
  }
}

export function loadBrandLogo(source: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = source;
  return image.decode().then(() => image);
}
