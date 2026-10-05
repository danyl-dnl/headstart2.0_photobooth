import { useEffect, useRef } from 'react';
import type { CapturedPhoto } from '../types/photo';
import { composePhotoStrip, loadBrandLogo, renderPhotoStrip } from './photoStrip';

type PhotoStripCanvasProps = {
  photos: readonly CapturedPhoto[];
  onCompositionReady?: (blob: Blob | null) => void;
  onCompositionFailed?: () => void;
  className?: string;
};

const brandLogoUrl = `${import.meta.env.BASE_URL}brand/excel-2026-logo-mark.png`;

/** The live progressive strip and final output share the same canvas drawing definition. */
export default function PhotoStripCanvas({ photos, onCompositionReady, onCompositionFailed, className = '' }: PhotoStripCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const photoSignature = photos.map((photo) => photo.objectUrl).join('|');

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    onCompositionReady?.(null);

    void (async () => {
      try {
        const logo = await loadBrandLogo(brandLogoUrl);
        if (!active) return;
        const currentPhotos = photosRef.current;
        if (currentPhotos.length === 3) {
          const blob = await composePhotoStrip(currentPhotos, logo, { canvas });
          if (active) onCompositionReady?.(blob);
        } else {
          await renderPhotoStrip(canvas, currentPhotos, logo);
        }
      } catch (error) {
        console.error('Unable to render the photo strip.', error);
        if (active) {
          onCompositionReady?.(null);
          onCompositionFailed?.();
        }
      }
    })();

    return () => { active = false; };
  }, [photoSignature, onCompositionReady, onCompositionFailed]);

  return <canvas key={photoSignature} ref={canvasRef} className={`photo-strip-canvas ${className}`.trim()} aria-label={`${photos.length} of 3 photos in the Headstart 2.0 strip`} role="img" />;
}
