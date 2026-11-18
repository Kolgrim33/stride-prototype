import { Icon } from '../icons.jsx';
import Photo from './Photo.jsx';

// Header for onboarding steps: back, progress through the current path, title.
export default function StepHeader({ onBack, step, total, kicker, title, photo = 'notebook', children }) {
  return (
    <header className="stack-12">
      <div className="step-top">
        {onBack ? (
          <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
            <Icon name="back" />
          </button>
        ) : (
          <span className="step-top-spacer" aria-hidden="true" />
        )}
        {total > 0 && (
          <div
            className="progress-line grow"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={step}
          >
            <span style={{ width: `${(step / total) * 100}%` }} />
          </div>
        )}
      </div>
      <Photo name={photo} />
      {kicker && <span className="kicker">{kicker}</span>}
      <h1 className="h1">{title}</h1>
      {children && <p className="body-muted">{children}</p>}
    </header>
  );
}
