import { useCallback, useEffect, useRef, useState } from 'react';
import ActionButton from '../components/ActionButton';
import type { CapturedPhoto, CapturedPhotoData, PhotoSession } from '../types/photo';
import { appendPhoto, createEmptyPhotoSession, isValidCapturedPhotoData, maxSessionPhotos, replacePhoto } from '../types/photoSession';
import { photoDeliveryService } from '../services/delivery';
import { createDeliveryAttemptGuard } from '../services/delivery/createDeliveryAttemptGuard';
import { PhotoObjectUrlRegistry } from '../services/delivery/PhotoObjectUrlRegistry';
import { PHOTO_STRIP_LAYOUT } from '../composition/photoStrip';
import CameraScreen from './CameraScreen';
import PreviewScreen from './PreviewScreen';
import WelcomeScreen from './WelcomeScreen';

type Screen = 'welcome' | 'camera' | 'preview';
const screenLabels: Record<Exclude<Screen, 'welcome'>, string> = { camera: 'Camera', preview: 'Your photo' };
const brandLogoUrl = `${import.meta.env.BASE_URL}brand/excel-2026-logo-mark.png`;

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const screenRef = useRef<Screen>('welcome');
  const [session, setSession] = useState<PhotoSession>(createEmptyPhotoSession);
  const sessionRef = useRef<PhotoSession>(createEmptyPhotoSession());
  const [composition, setComposition] = useState<CapturedPhotoData | null>(null);
  const compositionRef = useRef<CapturedPhotoData | null>(null);
  const [isDeliveryPending, setIsDeliveryPending] = useState(false);
  const retakePhotoIdRef = useRef<string | null>(null);
  const deliveryAttemptRef = useRef(createDeliveryAttemptGuard());
  const objectUrlsRef = useRef(new PhotoObjectUrlRegistry());

  const updateSession = useCallback((nextSession: PhotoSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);
  const transitionTo = useCallback((nextScreen: Screen) => { screenRef.current = nextScreen; setScreen(nextScreen); }, []);
  const clearComposition = useCallback(() => { compositionRef.current = null; setComposition(null); }, []);
  const handleCompositionReady = useCallback((blob: Blob | null) => {
    const result = blob ? {
      blob,
      capturedAt: sessionRef.current.photos[2]?.capturedAt ?? Date.now(),
      mimeType: 'image/jpeg',
      width: PHOTO_STRIP_LAYOUT.width,
      height: PHOTO_STRIP_LAYOUT.height,
    } : null;
    compositionRef.current = result;
    setComposition(result);
  }, []);

  useEffect(() => () => objectUrlsRef.current.dispose(), []);
  const photoUrlSignature = session.photos.map((photo) => photo.objectUrl).join('|');
  useEffect(() => () => {
    const stillOwned = new Set(sessionRef.current.photos.map((photo) => photo.objectUrl));
    objectUrlsRef.current.releaseUnused(stillOwned);
  }, [photoUrlSignature]);

  const startCamera = useCallback(() => {
    if (deliveryAttemptRef.current.inFlight || screenRef.current !== 'welcome') return;
    updateSession(createEmptyPhotoSession());
    clearComposition();
    retakePhotoIdRef.current = null;
    transitionTo('camera');
  }, [clearComposition, transitionTo, updateSession]);

  const startRetake = useCallback((photoId: string) => {
    if (deliveryAttemptRef.current.inFlight || screenRef.current !== 'preview') return;
    retakePhotoIdRef.current = photoId;
    clearComposition();
    transitionTo('camera');
  }, [clearComposition, transitionTo]);

  const returnToWelcome = useCallback(() => {
    if (deliveryAttemptRef.current.inFlight) return;
    if (screenRef.current === 'welcome' && sessionRef.current.photos.length === 0) return;
    updateSession(createEmptyPhotoSession());
    clearComposition();
    retakePhotoIdRef.current = null;
    transitionTo('welcome');
  }, [clearComposition, transitionTo, updateSession]);

  const handlePhotoCaptured = useCallback((photoData: CapturedPhotoData) => {
    if (screenRef.current !== 'camera') return;
    if (!isValidCapturedPhotoData(photoData)) throw new Error('The camera returned invalid photo data.');
    const currentSession = sessionRef.current;
    const replacingId = retakePhotoIdRef.current;
    if (replacingId ? !currentSession.photos.some((photo) => photo.id === replacingId) : currentSession.photos.length >= maxSessionPhotos) return;

    const id = replacingId ?? globalThis.crypto.randomUUID();
    let objectUrl: string;
    try { objectUrl = objectUrlsRef.current.create(photoData.blob); }
    catch (error) { console.error('Unable to prepare the captured photo preview.', error); throw error; }
    const photo: CapturedPhoto = { ...photoData, id, objectUrl };
    const nextSession = replacingId ? replacePhoto(currentSession, replacingId, photo) : appendPhoto(currentSession, photo);
    retakePhotoIdRef.current = null;
    updateSession(nextSession);
    if (replacingId || nextSession.photos.length === maxSessionPhotos) transitionTo('preview');
  }, [transitionTo, updateSession]);

  const handleCameraBack = useCallback(() => {
    if (screenRef.current === 'camera') returnToWelcome();
  }, [returnToWelcome]);

  const deliverComposition = useCallback(async () => {
    const currentComposition = compositionRef.current;
    if (deliveryAttemptRef.current.inFlight || screenRef.current !== 'preview' || !currentComposition) return;
    setIsDeliveryPending(true);
    try {
      const result = await deliveryAttemptRef.current.run(() => photoDeliveryService.deliver(currentComposition));
      if (!result) return;
      if (result.status === 'failed') { console.error('Photo delivery failed.', result.error); return; }
      if (screenRef.current !== 'preview' || compositionRef.current !== currentComposition) return;
      updateSession(createEmptyPhotoSession());
      clearComposition();
      retakePhotoIdRef.current = null;
      transitionTo('welcome');
    } catch (error) { console.error('Photo delivery failed unexpectedly.', error); }
    finally { setIsDeliveryPending(false); }
  }, [clearComposition, transitionTo, updateSession]);

  const retakePhotoNumber = retakePhotoIdRef.current
    ? session.photos.findIndex((photo) => photo.id === retakePhotoIdRef.current) + 1
    : null;

  return (
    <main className={`app-shell app-shell--${screen}`}>
      <header className="app-header">
        <div className="wordmark" aria-label="Photo Booth"><img className="wordmark__logo" src={brandLogoUrl} alt="" aria-hidden="true" /><span><strong>Excel 2026</strong> Photo Booth</span></div>
        {screen !== 'welcome' && <span className="app-header__step">{screenLabels[screen]}</span>}
      </header>
      <section className="screen" key={screen} aria-live="polite">
        {screen === 'welcome' && <WelcomeScreen onStart={startCamera} />}
        {screen === 'camera' && <CameraScreen photos={session.photos} retakePhotoId={retakePhotoIdRef.current} retakePhotoNumber={retakePhotoNumber} onPhotoCaptured={handlePhotoCaptured} onBack={handleCameraBack} />}
        {screen === 'preview' && session.photos.length === maxSessionPhotos && <PreviewScreen photos={session.photos} isCompositionReady={composition !== null} isDeliveryPending={isDeliveryPending} onCompositionReady={handleCompositionReady} onRetakePhoto={startRetake} onUsePhoto={deliverComposition} />}
      </section>
      {screen !== 'welcome' && <footer className="app-footer"><ActionButton variant="quiet" onClick={returnToWelcome}>Exit photo booth</ActionButton></footer>}
    </main>
  );
}
