import { useState, useRef, useLayoutEffect, useCallback } from "react";

const VOTE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

const INITIAL_COUNTRIES = [
  { id: "norway", name: "NORWAY", flag: "🇳🇴", points: 0 },
  { id: "belgium", name: "BELGIUM", flag: "🇧🇪", points: 0 },
  { id: "turkey", name: "TURKEY", flag: "🇹🇷", points: 0 },
  { id: "germany", name: "GERMANY", flag: "🇩🇪", points: 0 },
  { id: "russia", name: "RUSSIA", flag: "🇷🇺", points: 0 },
  { id: "croatia", name: "CROATIA", flag: "🇭🇷", points: 0 },
  { id: "austria", name: "AUSTRIA", flag: "🇦🇹", points: 0 },
  { id: "poland", name: "POLAND", flag: "🇵🇱", points: 0 },
  { id: "estonia", name: "ESTONIA", flag: "🇪🇪", points: 0 },
  { id: "sweden", name: "SWEDEN", flag: "🇸🇪", points: 0 },
  { id: "iceland", name: "ICELAND", flag: "🇮🇸", points: 0 },
  { id: "bosnia", name: "BOSNIA & HERZ.", flag: "🇧🇦", points: 0 },
  { id: "spain", name: "SPAIN", flag: "🇪🇸", points: 0 },
  { id: "romania", name: "ROMANIA", flag: "🇷🇴", points: 0 },
  { id: "netherlands", name: "NETHERLANDS", flag: "🇳🇱", points: 0 },
  { id: "malta", name: "MALTA", flag: "🇲🇹", points: 0 },
  { id: "ireland", name: "IRELAND", flag: "🇮🇪", points: 0 },
  { id: "portugal", name: "PORTUGAL", flag: "🇵🇹", points: 0 },
  { id: "greece", name: "GREECE", flag: "🇬🇷", points: 0 },
  { id: "cyprus", name: "CYPRUS", flag: "🇨🇾", points: 0 },
  { id: "israel", name: "ISRAEL", flag: "🇮🇱", points: 0 },
  { id: "uk", name: "UNITED KINGDOM", flag: "🇬🇧", points: 0 },
  { id: "ukraine", name: "UKRAINE", flag: "🇺🇦", points: 0 },
  { id: "france", name: "FRANCE", flag: "🇫🇷", points: 0 },
  { id: "latvia", name: "LATVIA", flag: "🇱🇻", points: 0 },
  { id: "slovenia", name: "SLOVENIA", flag: "🇸🇮", points: 0 },
];

const VOTING_COUNTRIES = [
  { id: "turkey", name: "TURKEY", flag: "🇹🇷" },
  { id: "sweden", name: "SWEDEN", flag: "🇸🇪" },
  { id: "france", name: "FRANCE", flag: "🇫🇷" },
  { id: "germany", name: "GERMANY", flag: "🇩🇪" },
  { id: "uk", name: "UNITED KINGDOM", flag: "🇬🇧" },
  { id: "spain", name: "SPAIN", flag: "🇪🇸" },
  { id: "norway", name: "NORWAY", flag: "🇳🇴" },
  { id: "russia", name: "RUSSIA", flag: "🇷🇺" },
  { id: "croatia", name: "CROATIA", flag: "🇭🇷" },
  { id: "austria", name: "AUSTRIA", flag: "🇦🇹" },
];

type Country = { id: string; name: string; flag: string; points: number };

// Stores previous DOM positions for FLIP animation
type Positions = Record<string, DOMRect>;

export default function Index() {
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [voterIdx, setVoterIdx] = useState(0);
  const [voteStep, setVoteStep] = useState(0);
  const [flyingId, setFlyingId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevPositions = useRef<Positions>({});
  const pendingFlip = useRef<{ movedId: string } | null>(null);

  const currentVoter = VOTING_COUNTRIES[voterIdx % VOTING_COUNTRIES.length];
  const currentScore = VOTE_ORDER[voteStep];

  // After state update, run FLIP for all rows
  useLayoutEffect(() => {
    if (!pendingFlip.current) return;
    const { movedId } = pendingFlip.current;
    pendingFlip.current = null;

    const prev = prevPositions.current;

    // For each row, compute delta and animate
    Object.entries(rowRefs.current).forEach(([id, el]) => {
      if (!el || !prev[id]) return;
      const next = el.getBoundingClientRect();
      const deltaY = prev[id].top - next.top;
      if (Math.abs(deltaY) < 1) return;

      const isMover = id === movedId;
      const duration = isMover ? 700 : 400;
      const easing = isMover ? "cubic-bezier(0.34,1.56,0.64,1)" : "ease";

      el.style.transition = "none";
      el.style.transform = `translateY(${deltaY}px)`;
      el.style.zIndex = isMover ? "100" : "1";
      el.style.boxShadow = isMover
        ? "0 12px 40px rgba(212,168,32,0.9), 0 0 30px rgba(255,215,0,0.6)"
        : "";

      requestAnimationFrame(() => {
        el.style.transition = `transform ${duration}ms ${easing}, box-shadow ${duration}ms ease`;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "";

        setTimeout(() => {
          el.style.zIndex = "";
          el.style.transition = "";
          if (id === movedId) setFlyingId(null);
        }, duration);
      });
    });
  });

  const handleCountryClick = useCallback(
    (id: string) => {
      if (isAnimating) return;
      setIsAnimating(true);

      // Snapshot current positions
      const snap: Positions = {};
      Object.entries(rowRefs.current).forEach(([cid, el]) => {
        if (el) snap[cid] = el.getBoundingClientRect();
      });
      prevPositions.current = snap;

      setFlyingId(id);

      const score = currentScore;
      pendingFlip.current = { movedId: id };

      setCountries((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, points: c.points + score } : c
        );
        return [...updated].sort((a, b) => b.points - a.points);
      });

      if (voteStep < VOTE_ORDER.length - 1) {
        setVoteStep((s) => s + 1);
      } else {
        setVoteStep(0);
        setVoterIdx((v) => v + 1);
      }

      setTimeout(() => setIsAnimating(false), 750);
    },
    [currentScore, voteStep, isAnimating]
  );

  const handleReset = () => {
    setCountries(INITIAL_COUNTRIES);
    setVoterIdx(0);
    setVoteStep(0);
    setFlyingId(null);
    setIsAnimating(false);
  };

  const sorted = [...countries];
  const leftCol = sorted.slice(0, 13);
  const rightCol = sorted.slice(13);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    rowRefs.current[id] = el;
  };

  return (
    <div className="esc-root">
      <div className="esc-bg-glow" />

      {/* Header */}
      <div className="esc-header">
        <div className="esc-stars">★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★</div>
        <h1 className="esc-title">EUROVISION SONG CONTEST</h1>
        <div className="esc-stars">★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★</div>
      </div>

      {/* Current voter */}
      <div className="esc-voter-wrap">
        <div className="esc-voter-card">
          <div className="esc-voter-flag-big">{currentVoter.flag}</div>
          <div className="esc-voter-details">
            <div className="esc-voter-giving">VOTES FROM</div>
            <div className="esc-voter-country">{currentVoter.name}</div>
          </div>
          <div className="esc-next-score">
            <div className="esc-next-label">NEXT</div>
            <div className="esc-next-value">{currentScore}</div>
            <div className="esc-next-pts">POINTS</div>
          </div>
        </div>
        <div className="esc-pip-row">
          {VOTE_ORDER.map((v, i) => (
            <span
              key={v}
              className={`esc-pip ${i < voteStep ? "done" : ""} ${i === voteStep ? "active" : ""}`}
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="esc-board">
        {/* Left column */}
        <div className="esc-column">
          {leftCol.map((country, idx) => (
            <div
              key={country.id}
              ref={setRef(country.id)}
              className={`esc-row ${flyingId === country.id ? "flying" : ""} ${isAnimating ? "" : "clickable"}`}
              onClick={() => handleCountryClick(country.id)}
            >
              <div className="esc-pos">{idx + 1}</div>
              <div className="esc-flag">{country.flag}</div>
              <div className="esc-name">{country.name}</div>
              <div className="esc-pts">{country.points}</div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="esc-column esc-column--right">
          {rightCol.map((country, idx) => (
            <div
              key={country.id}
              ref={setRef(country.id)}
              className={`esc-row ${flyingId === country.id ? "flying" : ""} ${isAnimating ? "" : "clickable"}`}
              onClick={() => handleCountryClick(country.id)}
            >
              <div className="esc-flag">{country.flag}</div>
              <div className="esc-name">{country.name}</div>
              <div className="esc-pts">{country.points}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset */}
      <div className="esc-footer">
        <button className="esc-reset" onClick={handleReset}>
          ↺ RESET SCORES
        </button>
      </div>
    </div>
  );
}
