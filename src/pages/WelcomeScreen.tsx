import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';

type WelcomeScreenProps = { onStart: () => void };

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [isCtaEngaged, setIsCtaEngaged] = useState(false);

  return (
    <div className="welcome-screen">
      <div className="welcome-screen__masthead">
        <p>Excel 2026 <span aria-hidden="true">/</span> Govt. Model Engineering College</p>
        <span className="welcome-screen__event-number">Race day <i /> Photo booth</span>
      </div>

      <section className="welcome-screen__poster" aria-label="Headstart 2.0 event photo booth">
        <div className="welcome-screen__poster-art" aria-hidden="true">
          <RouteGraphic stage="welcome" motionBoosted={isCtaEngaged} className="welcome-screen__circuit" />
          <span className="welcome-screen__art-number">2.0</span>
        </div>

        <div className="welcome-screen__headline-block">
          <p className="welcome-screen__kicker"><span className="welcome-screen__kicker-bar" />The finish starts here <span>/</span> Photo station</p>
          <h1 className="welcome-screen__title">
            <span className="welcome-screen__title-top"><span>Head</span><span className="welcome-screen__title-version">2.0</span></span>
            <span>Start</span>
          </h1>
          <div className="welcome-screen__subline">
            <span className="welcome-screen__distances"><b>5 KM</b> Marathon <i /> <b>2 KM</b> Walkathon</span>
          </div>
          <div className="welcome-screen__call-to-action">
            <ActionButton
              className="welcome-screen__button"
              onClick={onStart}
              onPointerEnter={() => setIsCtaEngaged(true)}
              onPointerLeave={(event) => setIsCtaEngaged(event.currentTarget === document.activeElement)}
              onPointerDown={() => setIsCtaEngaged(true)}
              onPointerUp={(event) => setIsCtaEngaged(event.currentTarget.matches(':hover') || event.currentTarget === document.activeElement)}
              onPointerCancel={() => setIsCtaEngaged(false)}
              onFocus={() => setIsCtaEngaged(true)}
              onBlur={(event) => setIsCtaEngaged(event.currentTarget.matches(':hover'))}
              aria-label="Start your Headstart 2.0 photo booth session"
            >
              <span className="welcome-screen__button-copy">
                <span className="welcome-screen__button-title">Photo booth</span>
                <span className="welcome-screen__button-prompt">Tap to start your session</span>
              </span>
              <ArrowRight size={24} strokeWidth={2.2} aria-hidden="true" />
            </ActionButton>
          </div>
        </div>

        <div className="welcome-screen__side-index" aria-hidden="true">H / 2.0</div>
      </section>

    </div>
  );
}
