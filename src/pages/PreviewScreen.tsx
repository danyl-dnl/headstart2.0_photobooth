import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';
import { Check, RotateCcw } from 'lucide-react';

type PreviewScreenProps = { photoUrl: string; isDeliveryPending: boolean; onRetake: () => void; onUsePhoto: () => void };

export default function PreviewScreen({ photoUrl, isDeliveryPending, onRetake, onUsePhoto }: PreviewScreenProps) {
  return (
    <div className="flow-screen preview-screen">
      <div className="preview-screen__heading">
        <div className="screen-heading screen-heading--left">
          <p className="eyebrow">Headstart 2.0 <span aria-hidden="true">/</span> Race-day photo</p>
          <h1 className="screen-title screen-title--display">Your photo.</h1>
        </div>
        <RouteGraphic stage="preview" />
      </div>
      <div className="photo-preview">
        <span className="photo-preview__corner photo-preview__corner--tl" aria-hidden="true" />
        <span className="photo-preview__corner photo-preview__corner--tr" aria-hidden="true" />
        <span className="photo-preview__corner photo-preview__corner--bl" aria-hidden="true" />
        <span className="photo-preview__corner photo-preview__corner--br" aria-hidden="true" />
        <img src={photoUrl} alt="Captured photo" />
      </div>
      <div className="preview-screen__actions">
        <span className="preview-screen__caption">Excel 2026 <i /> Photo 01</span>
        <div className="screen-actions">
        <ActionButton disabled={isDeliveryPending} variant="secondary" onClick={onRetake}><RotateCcw size={17} strokeWidth={1.8} aria-hidden="true" />Retake</ActionButton>
        <ActionButton disabled={isDeliveryPending} onClick={onUsePhoto}><Check size={18} strokeWidth={1.8} aria-hidden="true" /><span>Use photo</span></ActionButton>
        </div>
      </div>
    </div>
  );
}
