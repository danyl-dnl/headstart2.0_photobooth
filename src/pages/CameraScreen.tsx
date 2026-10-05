import { useCallback, useEffect, useRef, useState } from 'react';
import CameraPreview from '../camera/CameraPreview';
import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';
import PhotoStripCanvas from '../composition/PhotoStripCanvas';
import type { CapturedPhoto, CapturedPhotoData } from '../types/photo';
import { Camera, ChevronLeft } from 'lucide-react';

type CameraScreenProps = {
  photos: CapturedPhoto[];
  retakePhotoId: string | null;
  retakePhotoNumber: number | null;
  onPhotoCaptured: (photo: CapturedPhotoData) => void;
  onBack: () => void;
};

export default function CameraScreen({ photos, retakePhotoId, retakePhotoNumber, onPhotoCaptured, onBack }: CameraScreenProps) {
  const [captureRequest, setCaptureRequest] = useState(0);
  const [captureImmediatelyRequest, setCaptureImmediatelyRequest] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const autoFirstCaptureStartedRef = useRef(false);
  const captureRequestPendingRef = useRef(false);
  const handleCameraActiveChange = useCallback((isActive: boolean) => setIsCameraActive(isActive), []);
  const handleCaptureStateChange = useCallback((isActive: boolean) => {
    setIsCapturing(isActive);
    if (!isActive) captureRequestPendingRef.current = false;
  }, []);

  useEffect(() => {
    if (isCameraActive && photos.length === 0 && !retakePhotoId && !autoFirstCaptureStartedRef.current) {
      autoFirstCaptureStartedRef.current = true;
      captureRequestPendingRef.current = true;
      setCaptureRequest((request) => request + 1);
    }
  }, [isCameraActive, photos.length, retakePhotoId]);

  const requestPhoto = useCallback(() => {
    if (!isCameraActive || captureRequestPendingRef.current) return;
    captureRequestPendingRef.current = true;

    // Preserve the existing countdown for a first photo and for retakes.
    // Subsequent new photos are taken as soon as the user presses the button.
    if (retakePhotoId || photos.length === 0) {
      setCaptureRequest((request) => request + 1);
    } else {
      setCaptureImmediatelyRequest((request) => request + 1);
    }
  }, [isCameraActive, photos.length, retakePhotoId]);

  const nextPhotoNumber = retakePhotoNumber ?? photos.length + 1;
  const heading = retakePhotoNumber ? `Retake photo ${retakePhotoNumber}` : `Photo ${nextPhotoNumber} of 3`;

  return (
    <div className="flow-screen camera-screen">
      <div className="camera-screen__heading">
        <div className="screen-heading screen-heading--left">
          <p className="eyebrow">Headstart 2.0 <span aria-hidden="true">/</span> Photo station</p>
          <h1 className="screen-title screen-title--display">{heading}</h1>
        </div>
        <div className="camera-screen__progress">
          <span className={`status-indicator${isCameraActive ? ' status-indicator--ready' : ''}`}>
            <span className="status-dot" />{isCameraActive ? (isCapturing ? 'Hold your finish' : retakePhotoId ? 'Retake ready' : 'Camera ready') : 'Setting frame'}
          </span>
          <RouteGraphic stage="camera" />
        </div>
      </div>
      <div className="camera-screen__workspace">
        <CameraPreview
          captureRequest={captureRequest}
          captureImmediatelyRequest={captureImmediatelyRequest}
          onCameraActiveChange={handleCameraActiveChange}
          onCaptureStateChange={handleCaptureStateChange}
          onPhotoCaptured={onPhotoCaptured}
        />
        <div className="camera-screen__layout" aria-label="Your photo strip so far">
          <PhotoStripCanvas photos={photos} className="photo-strip-canvas--camera" />
          <span className="camera-screen__layout-caption">{photos.length} of 3 in the strip</span>
        </div>
      </div>
      <div className="camera-screen__instruction" aria-live="polite">
        {retakePhotoId ? 'The new shot will replace this frame.' : photos.length > 0 ? 'Ready for the next pose. Take your time.' : 'Get into position. Your first shot is about to begin.'}
      </div>
      <div className="screen-actions screen-actions--single">
        <ActionButton disabled={!isCameraActive || isCapturing} onClick={requestPhoto}>
          <Camera size={18} strokeWidth={1.8} aria-hidden="true" /><span>{isCapturing ? 'Get ready' : retakePhotoId ? 'Retake photo' : 'Take photo'}</span>
        </ActionButton>
        <ActionButton variant="quiet" onClick={onBack}><ChevronLeft size={17} strokeWidth={1.8} aria-hidden="true" />Back</ActionButton>
      </div>
    </div>
  );
}
