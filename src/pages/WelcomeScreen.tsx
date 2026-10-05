import { ArrowRight } from 'lucide-react';
import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';

type WelcomeScreenProps = { onStart: () => void };
const brandLogoUrl = `${import.meta.env.BASE_URL}brand/excel-2026-logo-mark.png`;

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-screen__masthead">
        <p>Excel 2026 <span aria-hidden="true">/</span> Govt. Model Engineering College</p>
        <span className="welcome-screen__event-number">Race day <i /> Photo booth</span>
      </div>

      <section className="welcome-screen__poster" aria-label="Headstart 2.0 event photo booth">
        <div className="welcome-screen__poster-art" aria-hidden="true">
          <div className="welcome-screen__road-stripe welcome-screen__road-stripe--one" />
          <div className="welcome-screen__road-stripe welcome-screen__road-stripe--two" />
          <div className="welcome-screen__road-stripe welcome-screen__road-stripe--three" />
          <span className="welcome-screen__art-number">2.0</span>
          <img className="brand-logo brand-logo--hero" src={brandLogoUrl} alt="" />
          <span className="welcome-screen__art-caption">Excel 2026<br />Official event mark</span>
        </div>

        <div className="welcome-screen__headline-block">
          <p className="welcome-screen__kicker"><span className="welcome-screen__kicker-bar" />The finish starts here <span>/</span> Photo station</p>
          <h1 className="welcome-screen__title"><span>Head</span><span>Start<span className="welcome-screen__title-dot">.</span></span></h1>
          <div className="welcome-screen__subline">
            <span className="welcome-screen__version">2.0</span>
            <span className="welcome-screen__distances"><b>5 KM</b> Marathon <i /> <b>2 KM</b> Walkathon</span>
          </div>
          <div className="welcome-screen__call-to-action">
            <ActionButton className="welcome-screen__button" onClick={onStart}>
              <span>Photo booth</span><ArrowRight size={24} strokeWidth={2.2} aria-hidden="true" />
            </ActionButton>
            <span className="welcome-screen__tap-hint">Tap to start <span aria-hidden="true">↗</span></span>
          </div>
        </div>

        <div className="welcome-screen__side-index" aria-hidden="true">H / 2.0</div>
      </section>

      <div className="welcome-screen__route-row">
        <span className="route-caption">Start line</span>
        <RouteGraphic stage="welcome" />
        <span className="route-caption">Finish</span>
      </div>
    </div>
  );
}
