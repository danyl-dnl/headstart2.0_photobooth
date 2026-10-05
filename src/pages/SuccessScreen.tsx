import ActionButton from '../components/ActionButton';
import RouteGraphic from '../components/RouteGraphic';
import { ArrowRight, Check } from 'lucide-react';

type SuccessScreenProps = { onStartAgain: () => void };
const brandLogoUrl = `${import.meta.env.BASE_URL}brand/excel-2026-logo-mark.png`;

export default function SuccessScreen({ onStartAgain }: SuccessScreenProps) {
  return (
    <div className="success-screen">
      <div className="success-screen__topline">
        <p className="eyebrow">Headstart 2.0 <span aria-hidden="true">/</span> Experience complete</p>
        <img className="brand-logo brand-logo--success" src={brandLogoUrl} alt="Excel 2026" />
      </div>
      <div className="success-screen__finish">
        <div className="success-screen__finish-mark" aria-hidden="true"><Check size={26} strokeWidth={1.8} /></div>
        <span className="success-screen__kicker">You made it <i /> Headstart 2.0</span>
        <h1 className="success-screen__title">Finish</h1>
        <p className="screen-copy">Photo ready.</p>
        <ActionButton onClick={onStartAgain}><span>Start again</span><ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" /></ActionButton>
      </div>
      <div className="success-screen__route">
        <span className="route-caption">Start</span>
        <RouteGraphic stage="finish" />
        <span className="route-caption">Finish</span>
      </div>
    </div>
  );
}
