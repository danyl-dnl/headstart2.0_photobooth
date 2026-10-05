import { useCallback, useEffect, useRef, useState } from 'react';
import ActionButton from '../components/ActionButton';
import type { CapturedPhotoData, PhotoSession } from '../types/photo';
import { photoDeliveryService } from '../services/delivery';
import CameraScreen from './CameraScreen';
import PreviewScreen from './PreviewScreen';
import SuccessScreen from './SuccessScreen';
import WelcomeScreen from './WelcomeScreen';

type Screen = 'welcome' | 'camera' | 'preview' | 'success';

const screenLabels: Record<Exclude<Screen, 'welcome'>, string> = {
  camera: 'Camera', preview: 'Your photo', success: 'Complete',
};
const brandLogoUrl = `${import.meta.env.BASE_URL}brand/excel-2026-logo-mark.png`;
const emptySession: PhotoSession = { photo: null, isPhotoSelected: false };

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const screenRef = useRef<Screen>('welcome');
  const [session, setSession] = useState<PhotoSession>(emptySession);
  const [isDeliveryPending, setIsDeliveryPending] = useState(false);
  const sessionRef = useRef<PhotoSession>(emptySession);
  const deliveryInProgressRef = useRef(false);
  const ownedObjectUrlsRef = useRef(new Set<string>());
  const photoUrl = session.photo?.objectUrl ?? null;

  const updateSession = useCallback((nextSession: PhotoSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  const transitionTo = useCallback((nextScreen: Screen) => {
    screenRef.current = nextScreen;
    setScreen(nextScreen);
  }, []);

  const releaseObjectUrl = useCallback((objectUrl: string) => {
    if (!ownedObjectUrlsRef.current.delete(objectUrl)) return;
    URL.revokeObjectURL(objectUrl);
  }, []);

  // The photo effect releases a previous URL only after the new screen commits.
  // The registry also covers an app unmount before that effect cleanup runs.
  useEffect(() => () => {
    ownedObjectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    ownedObjectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!photoUrl) return undefined;
    return () => releaseObjectUrl(photoUrl);
  }, [photoUrl, releaseObjectUrl]);

  const startCamera = useCallback(() => {
    const currentScreen = screenRef.current;
    if (deliveryInProgressRef.current || (currentScreen !== 'welcome' && currentScreen !== 'preview')) return;

    updateSession(emptySession);
    transitionTo('camera');
  }, [transitionTo, updateSession]);

  const returnToWelcome = useCallback(() => {
    if (deliveryInProgressRef.current) return;
    if (screenRef.current === 'welcome' && sessionRef.current.photo === null) return;

    updateSession(emptySession);
    transitionTo('welcome');
  }, [transitionTo, updateSession]);

  const handlePhotoCaptured = useCallback((photoData: CapturedPhotoData) => {
    if (screenRef.current !== 'camera' || sessionRef.current.photo !== null) return;

    let objectUrl: string;
    try {
      objectUrl = URL.createObjectURL(photoData.blob);
    } catch (error) {
      console.error('Unable to prepare the captured photo preview.', error);
      throw error;
    }

    ownedObjectUrlsRef.current.add(objectUrl);
    updateSession({ photo: { ...photoData, objectUrl }, isPhotoSelected: false });
    transitionTo('preview');
  }, [transitionTo, updateSession]);

  const selectPhoto = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (
      deliveryInProgressRef.current
      || screenRef.current !== 'preview'
      || !currentSession.photo
      || currentSession.isPhotoSelected
    ) return;

    const photo = currentSession.photo;
    deliveryInProgressRef.current = true;
    setIsDeliveryPending(true);

    try {
      const result = await photoDeliveryService.deliver(photo);
      if (result.status === 'failed') {
        console.error('Photo delivery failed.', result.error);
        return;
      }

      const latestSession = sessionRef.current;
      if (screenRef.current !== 'preview' || latestSession.photo !== photo) return;

      updateSession({ ...latestSession, isPhotoSelected: true });
      transitionTo('success');
    } catch (error) {
      console.error('Photo delivery failed unexpectedly.', error);
    } finally {
      deliveryInProgressRef.current = false;
      setIsDeliveryPending(false);
    }
  }, [transitionTo, updateSession]);

  return (
    <main className={`app-shell app-shell--${screen}`}>
      <header className="app-header">
        <div className="wordmark" aria-label="Photo Booth">
          <img className="wordmark__logo" src={brandLogoUrl} alt="" aria-hidden="true" />
          <span><strong>Excel 2026</strong> Photo Booth</span>
        </div>
        {screen !== 'welcome' && <span className="app-header__step">{screenLabels[screen]}</span>}
      </header>
      <section className="screen" key={screen} aria-live="polite">
        {screen === 'welcome' && <WelcomeScreen onStart={startCamera} />}
        {screen === 'camera' && <CameraScreen onPhotoCaptured={handlePhotoCaptured} onBack={returnToWelcome} />}
        {screen === 'preview' && session.photo && <PreviewScreen photoUrl={session.photo.objectUrl} isDeliveryPending={isDeliveryPending} onRetake={startCamera} onUsePhoto={selectPhoto} />}
        {screen === 'success' && session.isPhotoSelected && <SuccessScreen onStartAgain={returnToWelcome} />}
      </section>
      {screen !== 'welcome' && screen !== 'success' && (
        <footer className="app-footer">
          <ActionButton variant="quiet" onClick={returnToWelcome}>Exit photo booth</ActionButton>
        </footer>
      )}
    </main>
  );
}
