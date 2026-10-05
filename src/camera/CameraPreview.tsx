import { CameraOff, LoaderCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';
import type { CapturedPhotoData } from '../types/photo';
import { captureVideoFrame } from './captureFrame';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'not-found' | 'in-use' | 'error';

type CameraPreviewProps = {
  captureRequest: number;
  onCameraActiveChange: (isActive: boolean) => void;
  onCaptureStateChange: (isCapturing: boolean) => void;
  onPhotoCaptured: (photo: CapturedPhotoData) => void;
};

type CameraMessage = {
  title: string;
  description: string;
};

const statusMessages: Record<Exclude<CameraStatus, 'active'>, CameraMessage> = {
  idle: {
    title: 'Starting camera',
    description: 'Please wait a moment.',
  },
  requesting: {
    title: 'Starting camera',
    description: 'Please wait a moment.',
  },
  denied: {
    title: 'Camera access is required',
    description: 'Camera access is unavailable. Please ask a staff member for assistance.',
  },
  'not-found': {
    title: 'Camera not found',
    description: 'Please connect a camera and try again.',
  },
  'in-use': {
    title: 'Camera unavailable',
    description: 'The camera may already be in use by another application.',
  },
  error: {
    title: 'Unable to start the camera',
    description: 'Please try again.',
  },
};

function getCameraStatus(error: unknown): Exclude<CameraStatus, 'idle' | 'requesting' | 'active'> {
  if (!(error instanceof DOMException)) {
    return 'error';
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'denied';
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'not-found';
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'in-use';
  }

  return 'error';
}

export default function CameraPreview({
  captureRequest,
  onCameraActiveChange,
  onCaptureStateChange,
  onPhotoCaptured,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const captureRef = useRef(0);
  const isCapturingRef = useRef(false);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);

  const updateStatus = useCallback((nextStatus: CameraStatus) => {
    setStatus(nextStatus);
    onCameraActiveChange(nextStatus === 'active');
  }, [onCameraActiveChange]);

  const releaseCamera = useCallback(() => {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const cancelCapture = useCallback(() => {
    captureRef.current += 1;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setCountdown(null);

    if (isCapturingRef.current) {
      isCapturingRef.current = false;
      onCaptureStateChange(false);
    }
  }, [onCaptureStateChange]);

  const startCamera = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    releaseCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      updateStatus('error');
      console.error('Camera API is not available in this renderer.');
      return;
    }

    updateStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (requestId !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const handleUnexpectedTrackEnd = () => {
        if (streamRef.current !== stream) return;

        console.error('The active camera stream stopped unexpectedly.');
        cancelCapture();
        releaseCamera();
        updateStatus('error');
      };
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', handleUnexpectedTrackEnd, { once: true });
      });
      video.srcObject = stream;
      await video.play();

      if (requestId !== requestRef.current) {
        releaseCamera();
        return;
      }

      updateStatus('active');
    } catch (error) {
      if (requestId !== requestRef.current) {
        return;
      }

      releaseCamera();
      console.error('Unable to start camera preview.', error);
      updateStatus(getCameraStatus(error));
    }
  }, [cancelCapture, releaseCamera, updateStatus]);

  const startCountdown = useCallback(() => {
    const video = videoRef.current;

    // A repeated tap during the active countdown is a no-op. It must not be
    // treated as a camera-readiness failure or release the live stream.
    if (isCapturingRef.current) return;

    if (
      status !== 'active'
      || !video
      || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      if (status === 'active') {
        releaseCamera();
        updateStatus('error');
        console.error('Camera preview was not ready when capture began.');
      }
      return;
    }

    const captureId = captureRef.current + 1;
    captureRef.current = captureId;
    isCapturingRef.current = true;
    onCaptureStateChange(true);
    setCountdown(3);

    const showNextNumber = (currentNumber: number) => {
      timerRef.current = window.setTimeout(async () => {
        if (captureId !== captureRef.current) {
          return;
        }

        if (currentNumber > 1) {
          setCountdown(currentNumber - 1);
          showNextNumber(currentNumber - 1);
          return;
        }

        timerRef.current = null;
        setCountdown(null);

        try {
          const photo = await captureVideoFrame(video);

          if (captureId !== captureRef.current) {
            return;
          }

          onPhotoCaptured(photo);
        } catch (error) {
          if (captureId === captureRef.current) {
            releaseCamera();
            updateStatus('error');
            console.error('Unable to capture the current camera frame.', error);
          }
        } finally {
          if (captureId === captureRef.current) {
            isCapturingRef.current = false;
            onCaptureStateChange(false);
          }
        }
      }, 1000);
    };

    showNextNumber(3);
  }, [onCaptureStateChange, onPhotoCaptured, releaseCamera, status, updateStatus]);

  useEffect(() => {
    void startCamera();

    return () => {
      requestRef.current += 1;
      cancelCapture();
      releaseCamera();
      onCameraActiveChange(false);
    };
  }, [cancelCapture, onCameraActiveChange, releaseCamera, startCamera]);

  useEffect(() => {
    const cancelWhenInactive = () => {
      if (document.visibilityState === 'hidden') cancelCapture();
    };

    window.addEventListener('blur', cancelCapture);
    document.addEventListener('visibilitychange', cancelWhenInactive);
    return () => {
      window.removeEventListener('blur', cancelCapture);
      document.removeEventListener('visibilitychange', cancelWhenInactive);
    };
  }, [cancelCapture]);

  useEffect(() => {
    if (captureRequest > 0) {
      startCountdown();
    }
  }, [captureRequest, startCountdown]);

  const isActive = status === 'active';
  const isLoading = status === 'idle' || status === 'requesting';
  const message = isActive ? null : statusMessages[status];

  return (
    <div className="media-placeholder media-placeholder--camera camera-preview" aria-busy={!isActive}>
      <video
        ref={videoRef}
        className="camera-preview__video"
        autoPlay
        muted
        playsInline
        aria-label="Live camera preview"
      />
      {countdown !== null && (
        <div className="camera-preview__countdown" data-countdown={countdown} aria-live="assertive" aria-label={`Countdown: ${countdown}`}>
          <span className="camera-preview__countdown-label">Get ready</span>
          <span key={countdown} className="camera-preview__countdown-number">{countdown}</span>
          <RouteGraphic stage="countdown" countdown={countdown} />
        </div>
      )}
      {!isActive && message && (
        <div className="camera-preview__status" role={isLoading ? 'status' : 'alert'}>
          <span className="camera-preview__icon" aria-hidden="true">
            {isLoading ? <LoaderCircle className="camera-preview__loader" size={31} strokeWidth={1.5} /> : <CameraOff size={31} strokeWidth={1.5} />}
          </span>
          <span className="camera-preview__title">{message.title}</span>
          <span className="camera-preview__description">{message.description}</span>
          {!isLoading && (
            <ActionButton className="camera-preview__retry" variant="secondary" onClick={() => void startCamera()}>
              <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
              Retry
            </ActionButton>
          )}
        </div>
      )}
      <span className="camera-preview__frame-corner camera-preview__frame-corner--tl" aria-hidden="true" />
      <span className="camera-preview__frame-corner camera-preview__frame-corner--tr" aria-hidden="true" />
      <span className="camera-preview__frame-corner camera-preview__frame-corner--bl" aria-hidden="true" />
      <span className="camera-preview__frame-corner camera-preview__frame-corner--br" aria-hidden="true" />
      <span className="media-placeholder__caption">{isActive ? 'Live camera' : 'Camera'}</span>
    </div>
  );
}
