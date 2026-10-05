import { useCallback, useState } from 'react';
import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';
import PhotoStripCanvas from '../composition/PhotoStripCanvas';
import type { CapturedPhoto } from '../types/photo';
import { Check, RotateCcw } from 'lucide-react';

type PreviewScreenProps = {
  photos: CapturedPhoto[];
  isCompositionReady: boolean;
  isDeliveryPending: boolean;
  onCompositionReady: (blob: Blob | null) => void;
  onRetakePhoto: (photoId: string) => void;
  onUsePhoto: () => void;
};

export default function PreviewScreen({ photos, isCompositionReady, isDeliveryPending, onCompositionReady, onRetakePhoto, onUsePhoto }: PreviewScreenProps) {
  const [compositionFailed, setCompositionFailed] = useState(false);
  const handleCompositionFailed = useCallback(() => setCompositionFailed(true), []);
  return (
    <div className="flow-screen preview-screen">
      <div className="preview-screen__heading">
        <div className="screen-heading screen-heading--left">
          <p className="eyebrow">Headstart 2.0 <span aria-hidden="true">/</span> Race-day photo</p>
          <h1 className="screen-title screen-title--display">Your photo.</h1>
        </div>
        <RouteGraphic stage="preview" />
      </div>
      <div className="photo-preview photo-preview--strip">
        <span className="photo-preview__corner photo-preview__corner--tl" aria-hidden="true" />
        <span className="photo-preview__corner photo-preview__corner--tr" aria-hidden="true" />
        <span className="photo-preview__corner photo-preview__corner--bl" aria-hidden="true" />
        <span className="photo-preview__corner photo-preview__corner--br" aria-hidden="true" />
        <PhotoStripCanvas photos={photos} onCompositionReady={onCompositionReady} onCompositionFailed={handleCompositionFailed} className="photo-strip-canvas--final" />
        {!isCompositionReady && <span className="photo-preview__preparing" role="status">{compositionFailed ? 'Photo strip unavailable · retake a frame to try again' : 'Preparing your photo strip…'}</span>}
      </div>
      <div className="preview-screen__retake">
        <span>Retake a frame</span>
        <div className="preview-screen__retake-buttons">
          {photos.map((photo, index) => <button type="button" key={photo.id} onClick={() => onRetakePhoto(photo.id)} disabled={isDeliveryPending} aria-label={`Retake photo ${index + 1}`}>
            <RotateCcw size={13} aria-hidden="true" />{String(index + 1).padStart(2, '0')}
          </button>)}
        </div>
      </div>
      <div className="preview-screen__actions">
        <span className="preview-screen__caption">Excel 2026 <i /> Three frames · One finish</span>
        <div className="screen-actions">
          <ActionButton disabled={!isCompositionReady || isDeliveryPending} onClick={onUsePhoto}><Check size={18} strokeWidth={1.8} aria-hidden="true" /><span>Use photo</span></ActionButton>
        </div>
      </div>
    </div>
  );
}
