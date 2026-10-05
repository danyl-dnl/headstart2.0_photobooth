import { useCallback, useState } from 'react';
import CameraPreview from '../camera/CameraPreview';
import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';
import type { CapturedPhotoData } from '../types/photo';
import { Camera, ChevronLeft } from 'lucide-react';

type CameraScreenProps = { onPhotoCaptured: (photo: CapturedPhotoData) => void; onBack: () => void };

export default function CameraScreen({ onPhotoCaptured, onBack }: CameraScreenProps) {
  const [captureRequest, setCaptureRequest] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const handleCameraActiveChange = useCallback((isActive: boolean) => setIsCameraActive(isActive), []);
  const handleCaptureStateChange = useCallback((isActive: boolean) => setIsCapturing(isActive), []);

  return (
    <div className="flow-screen camera-screen">
      <div className="camera-screen__heading">
        <div className="screen-heading screen-heading--left">
          <p className="eyebrow">Headstart 2.0 <span aria-hidden="true">/</span> Photo station</p>
          <h1 className="screen-title screen-title--display">Ready?</h1>
        </div>
        <div className="camera-screen__progress">
          <span className={`status-indicator${isCameraActive ? ' status-indicator--ready' : ''}`}>
            <span className="status-dot" />{isCameraActive ? 'Camera ready' : isCapturing ? 'Hold your finish' : 'Setting frame'}
          </span>
          <RouteGraphic stage="camera" />
        </div>
      </div>
      <CameraPreview
        captureRequest={captureRequest}
        onCameraActiveChange={handleCameraActiveChange}
        onCaptureStateChange={handleCaptureStateChange}
        onPhotoCaptured={onPhotoCaptured}
      />
      <div className="screen-actions screen-actions--single">
        <ActionButton disabled={!isCameraActive || isCapturing} onClick={() => setCaptureRequest((request) => request + 1)}>
          <Camera size={18} strokeWidth={1.8} aria-hidden="true" /><span>{isCapturing ? 'Get ready' : 'Take photo'}</span>
        </ActionButton>
        <ActionButton variant="quiet" onClick={onBack}><ChevronLeft size={17} strokeWidth={1.8} aria-hidden="true" />Back</ActionButton>
      </div>
    </div>
  );
}
