import { useState, forwardRef } from "react";

interface LandingProps {
  leaving: boolean;
  active: boolean;
  onEnter: (btn: HTMLButtonElement) => void;
}

const Landing = forwardRef<HTMLButtonElement, LandingProps>(function Landing(
  { leaving, active, onEnter },
  enterBtnRef
) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
    onEnter(e.currentTarget);
  }

  return (
    <section className={`view view-landing${leaving ? " leaving" : ""}${active ? " active" : ""}`}>
      <div className="landing-inner">
        <div className="wordmark">
          Haven
          <span className="kana">Communities for everything you care about</span>
        </div>

        <div className="tree-wrap">
          <svg className="tree-art tree-idle" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg">
            <path className="trunk" d="M160 300 C158 260 162 230 158 205 C155 185 148 175 150 155 C151 140 160 130 158 110 C157 95 150 85 152 68" />
            <path className="branch branch-a" d="M158 205 C 130 195, 105 195, 78 170" />
            <path className="branch branch-b" d="M155 155 C 185 148, 210 150, 235 128" />
            <path className="branch branch-c" d="M152 110 C 122 100, 100 100, 75 78" />
            <path className="branch branch-d" d="M152 68 C 175 55, 195 50, 220 30" />

            <circle className="bloom b1" cx="78" cy="170" r="9" />
            <circle className="bloom light b2" cx="60" cy="158" r="7" />
            <circle className="bloom bright b3" cx="92" cy="150" r="6" />

            <circle className="bloom bright b4" cx="235" cy="128" r="10" />
            <circle className="bloom b5" cx="255" cy="112" r="7" />
            <circle className="bloom light b6" cx="215" cy="112" r="6" />

            <circle className="bloom light b7" cx="75" cy="78" r="8" />
            <circle className="bloom b8" cx="55" cy="65" r="7" />
            <circle className="bloom bright b9" cx="90" cy="58" r="6" />

            <circle className="bloom bright b10" cx="220" cy="30" r="9" />
            <circle className="bloom light b11" cx="240" cy="15" r="7" />
            <circle className="bloom b12" cx="198" cy="15" r="6" />

            <circle className="bloom light b13" cx="150" cy="155" r="6" />
            <circle className="bloom bright b14" cx="158" cy="110" r="6" />
            <circle className="bloom b15" cx="152" cy="68" r="6" />
            <circle className="bloom light b16" cx="130" cy="185" r="5" />
            <circle className="bloom bright b17" cx="185" cy="170" r="5" />
            <circle className="bloom b18" cx="180" cy="90" r="5" />
          </svg>
        </div>

        <p className="tagline">
          Find your people. Own <em>your</em> corner of the internet.
        </p>
        <p className="art-caption">Discover communities, share posts, vote on what matters, and have real conversations.</p>

        <div className="cta-wrap">
          <button
            className="cta-btn"
            type="button"
            ref={enterBtnRef}
            onClick={handleClick}
          >
            <svg className="petal-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2c-1.8 0-2 1.6-2.6 2.3C6.5 6.7 4 9.6 4 13c0 3.6 2.8 6.6 6.4 7.8.5.2 1.1.2 1.6 0C15.6 19.6 18.4 16.6 18.4 13c0-3.4-2.5-6.3-5.4-8.7C12.4 3.6 12.2 2 12 2z" />
            </svg>
            <span>Join the Community</span>
            <span className="cta-en">入る</span>
            <span className="cta-sheen" aria-hidden="true" />
            <span className="cta-ripple-layer" aria-hidden="true">
              {ripples.map((r) => (
                <span key={r.id} className="cta-ripple" style={{ left: r.x, top: r.y }} />
              ))}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
});

export default Landing;
