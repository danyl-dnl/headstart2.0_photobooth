import { useCallback, useEffect, useState } from 'react';
import ActionButton from '../components/ActionButton';
import CameraScreen from './CameraScreen';
import PreviewScreen from './PreviewScreen';
import SuccessScreen from './SuccessScreen';
import WelcomeScreen from './WelcomeScreen';

type Screen = 'welcome' | 'camera' | 'preview' | 'success';

const screenLabels: Record<Exclude<Screen, 'welcome'>, string> = {
  camera: 'Camera', preview: 'Your photo', success: 'Complete',
};
const brandLogoUrl = `${import.meta.env.BASE_URL}brand/excel-2026-logo-mark.png`;

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
  }, [photoUrl]);

  const startCamera = useCallback(() => {
    setPhotoUrl(null);
    setScreen('camera');
  }, []);

  const returnToWelcome = useCallback(() => {
    setPhotoUrl(null);
    setScreen('welcome');
  }, []);

  const handlePhotoCaptured = useCallback((photo: Blob) => {
    setPhotoUrl(URL.createObjectURL(photo));
    setScreen('preview');
  }, []);

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
        {screen === 'preview' && photoUrl && <PreviewScreen photoUrl={photoUrl} onRetake={startCamera} onUsePhoto={() => setScreen('success')} />}
        {screen === 'success' && <SuccessScreen onStartAgain={returnToWelcome} />}
      </section>
      {screen !== 'welcome' && screen !== 'success' && (
        <footer className="app-footer">
          <ActionButton variant="quiet" onClick={returnToWelcome}>Exit photo booth</ActionButton>
        </footer>
      )}
    </main>
  );
}
