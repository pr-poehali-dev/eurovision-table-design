import { useState, useRef, useCallback, useEffect } from "react";

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

type FlyState = {
  id: string;
  flag: string;
  name: string;
  currentPoints: number;
  addedScore: number;
  fromY: number;
  fromX: number;
  toY: number;
  toX: number;
  width: number;
} | null;

export default function Index() {
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [voterIdx, setVoterIdx] = useState(0);
  const [voteStep, setVoteStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyState, setFlyState] = useState<FlyState>(null);
  const [flyPhase, setFlyPhase] = useState<"idle" | "flying" | "landing">("idle");

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);

  const currentVoter = VOTING_COUNTRIES[voterIdx % VOTING_COUNTRIES.length];
  const currentScore = VOTE_ORDER[voteStep];

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    rowRefs.current[id] = el;
  };

  const handleCountryClick = useCallback(
    (clickedId: string) => {
      if (isAnimating) return;

      const clickedCountry = countries.find((c) => c.id === clickedId);
      if (!clickedCountry) return;

      const fromEl = rowRefs.current[clickedId];
      if (!fromEl) return;

      const score = currentScore;

      // Compute new sorted list to find destination position
      const updatedList = countries
        .map((c) => (c.id === clickedId ? { ...c, points: c.points + score } : c))
        .sort((a, b) => b.points - a.points);

      const newIdx = updatedList.findIndex((c) => c.id === clickedId);
      const isLeftCol = newIdx < 13;

      const fromRect = fromEl.getBoundingClientRect();

      setIsAnimating(true);

      // Set fly state with FROM position, TO will be computed after state update
      setFlyState({
        id: clickedId,
        flag: clickedCountry.flag,
        name: clickedCountry.name,
        currentPoints: clickedCountry.points,
        addedScore: score,
        fromY: fromRect.top,
        fromX: fromRect.left,
        toY: fromRect.top, // placeholder, updated after render
        toX: fromRect.left,
        width: fromRect.width,
      });
      setFlyPhase("flying");

      // Update countries state
      setCountries(updatedList);

      if (voteStep < VOTE_ORDER.length - 1) {
        setVoteStep((s) => s + 1);
      } else {
        setVoteStep(0);
        setVoterIdx((v) => v + 1);
      }
    },
    [countries, currentScore, voteStep, isAnimating]
  );

  // After countries update, measure target position and trigger flight
  useEffect(() => {
    if (flyPhase !== "flying" || !flyState) return;

    // Small delay to let DOM rerender
    const timer = setTimeout(() => {
      const targetEl = rowRefs.current[flyState.id];
      if (!targetEl) {
        finishAnimation();
        return;
      }
      const toRect = targetEl.getBoundingClientRect();

      setFlyState((prev) =>
        prev
          ? {
              ...prev,
              toY: toRect.top,
              toX: toRect.left,
              width: toRect.width,
            }
          : null
      );
      setFlyPhase("landing");
    }, 30);

    return () => clearTimeout(timer);
  }, [flyPhase, flyState?.id]);

  // After landing phase animation ends
  const finishAnimation = useCallback(() => {
    setFlyState(null);
    setFlyPhase("idle");
    setIsAnimating(false);
  }, []);

  const handleReset = () => {
    setCountries(INITIAL_COUNTRIES);
    setVoterIdx(0);
    setVoteStep(0);
    setFlyState(null);
    setFlyPhase("idle");
    setIsAnimating(false);
  };

  const sorted = [...countries];
  const leftCol = sorted.slice(0, 13);
  const rightCol = sorted.slice(13);

  // Compute flying row style
  const flyStyle: React.CSSProperties = (() => {
    if (!flyState) return { display: "none" };

    const isLanding = flyPhase === "landing";
    const y = isLanding ? flyState.toY : flyState.fromY;
    const x = isLanding ? flyState.toX : flyState.fromX;

    return {
      position: "fixed",
      top: flyState.fromY,
      left: flyState.fromX,
      width: flyState.width,
      zIndex: 9999,
      transform: isLanding
        ? `translate(${flyState.toX - flyState.fromX}px, ${flyState.toY - flyState.fromY}px)`
        : "translate(0, 0)",
      transition: isLanding
        ? "transform 650ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none",
      pointerEvents: "none",
    };
  })();

  return (
    <div className="esc-root" ref={boardRef}>
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
              className={`esc-row ${flyState?.id === country.id ? "esc-row--ghost" : ""} ${!isAnimating ? "clickable" : ""}`}
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
              className={`esc-row ${flyState?.id === country.id ? "esc-row--ghost" : ""} ${!isAnimating ? "clickable" : ""}`}
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

      {/* Flying row — absolute clone that travels across the screen */}
      {flyState && (
        <div
          style={flyStyle}
          onTransitionEnd={finishAnimation}
          className="esc-row esc-row--flying"
        >
          <div className="esc-flag">{flyState.flag}</div>
          <div className="esc-name">{flyState.name}</div>
          <div className="esc-pts">{flyState.currentPoints + flyState.addedScore}</div>
          <div className="esc-score-bubble">+{flyState.addedScore}</div>
        </div>
      )}
    </div>
  );
}
