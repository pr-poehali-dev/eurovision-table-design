import { useState, useRef, useCallback, useEffect } from "react";

const VOTE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

// Флаги через реальные изображения Twemoji для точности
const FLAG_URL = (code: string) =>
  `https://flagcdn.com/48x36/${code}.png`;

type ScoreBadge = { score: number; voterCode: string };

const INITIAL_COUNTRIES = [
  { id: "norway",      name: "NORWAY",           code: "no", points: 0, badges: [] as ScoreBadge[] },
  { id: "belgium",     name: "BELGIUM",           code: "be", points: 0, badges: [] as ScoreBadge[] },
  { id: "turkey",      name: "TURKEY",            code: "tr", points: 0, badges: [] as ScoreBadge[] },
  { id: "germany",     name: "GERMANY",           code: "de", points: 0, badges: [] as ScoreBadge[] },
  { id: "russia",      name: "RUSSIA",            code: "ru", points: 0, badges: [] as ScoreBadge[] },
  { id: "croatia",     name: "CROATIA",           code: "hr", points: 0, badges: [] as ScoreBadge[] },
  { id: "austria",     name: "AUSTRIA",           code: "at", points: 0, badges: [] as ScoreBadge[] },
  { id: "poland",      name: "POLAND",            code: "pl", points: 0, badges: [] as ScoreBadge[] },
  { id: "estonia",     name: "ESTONIA",           code: "ee", points: 0, badges: [] as ScoreBadge[] },
  { id: "sweden",      name: "SWEDEN",            code: "se", points: 0, badges: [] as ScoreBadge[] },
  { id: "iceland",     name: "ICELAND",           code: "is", points: 0, badges: [] as ScoreBadge[] },
  { id: "bosnia",      name: "BOSNIA & HERZEGOVINA", code: "ba", points: 0, badges: [] as ScoreBadge[] },
  { id: "spain",       name: "SPAIN",             code: "es", points: 0, badges: [] as ScoreBadge[] },
  { id: "romania",     name: "ROMANIA",           code: "ro", points: 0, badges: [] as ScoreBadge[] },
  { id: "netherlands", name: "NETHERLANDS",       code: "nl", points: 0, badges: [] as ScoreBadge[] },
  { id: "malta",       name: "MALTA",             code: "mt", points: 0, badges: [] as ScoreBadge[] },
  { id: "ireland",     name: "IRELAND",           code: "ie", points: 0, badges: [] as ScoreBadge[] },
  { id: "portugal",    name: "PORTUGAL",          code: "pt", points: 0, badges: [] as ScoreBadge[] },
  { id: "greece",      name: "GREECE",            code: "gr", points: 0, badges: [] as ScoreBadge[] },
  { id: "cyprus",      name: "CYPRUS",            code: "cy", points: 0, badges: [] as ScoreBadge[] },
  { id: "israel",      name: "ISRAEL",            code: "il", points: 0, badges: [] as ScoreBadge[] },
  { id: "uk",          name: "UNITED KINGDOM",    code: "gb", points: 0, badges: [] as ScoreBadge[] },
  { id: "ukraine",     name: "UKRAINE",           code: "ua", points: 0, badges: [] as ScoreBadge[] },
  { id: "france",      name: "FRANCE",            code: "fr", points: 0, badges: [] as ScoreBadge[] },
  { id: "latvia",      name: "LATVIA",            code: "lv", points: 0, badges: [] as ScoreBadge[] },
  { id: "slovenia",    name: "SLOVENIA",          code: "si", points: 0, badges: [] as ScoreBadge[] },
];

const VOTING_COUNTRIES = [
  { id: "turkey",   name: "TURKEY",         code: "tr" },
  { id: "sweden",   name: "SWEDEN",         code: "se" },
  { id: "france",   name: "FRANCE",         code: "fr" },
  { id: "germany",  name: "GERMANY",        code: "de" },
  { id: "uk",       name: "UNITED KINGDOM", code: "gb" },
  { id: "spain",    name: "SPAIN",          code: "es" },
  { id: "norway",   name: "NORWAY",         code: "no" },
  { id: "russia",   name: "RUSSIA",         code: "ru" },
  { id: "croatia",  name: "CROATIA",        code: "hr" },
  { id: "austria",  name: "AUSTRIA",        code: "at" },
];

type Country = {
  id: string;
  name: string;
  code: string;
  points: number;
  badges: ScoreBadge[];
};

type FlyState = {
  id: string;
  code: string;
  name: string;
  newPoints: number;
  addedScore: number;
  fromY: number;
  fromX: number;
  toY: number;
  toX: number;
  width: number;
  height: number;
} | null;

export default function Index() {
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [voterIdx, setVoterIdx] = useState(0);
  const [voteStep, setVoteStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyState, setFlyState] = useState<FlyState>(null);
  const [flyPhase, setFlyPhase] = useState<"idle" | "measuring" | "flying">("idle");
  // Track which countries were already voted by current voter this round
  const [votedThisRound, setVotedThisRound] = useState<Set<string>>(new Set());
  // Track displaced rows during animation
  const [displacedIds, setDisplacedIds] = useState<Set<string>>(new Set());

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const currentVoter = VOTING_COUNTRIES[voterIdx % VOTING_COUNTRIES.length];
  const currentScore = VOTE_ORDER[voteStep];

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    rowRefs.current[id] = el;
  };

  const handleCountryClick = useCallback(
    (clickedId: string) => {
      if (isAnimating) return;
      // No voting for self
      if (clickedId === currentVoter.id) return;
      // No double voting
      if (votedThisRound.has(clickedId)) return;

      const clickedCountry = countries.find((c) => c.id === clickedId);
      if (!clickedCountry) return;

      const fromEl = rowRefs.current[clickedId];
      if (!fromEl) return;

      const score = currentScore;
      const fromRect = fromEl.getBoundingClientRect();

      // Compute new list to know which rows get displaced
      const updatedList = countries
        .map((c) =>
          c.id === clickedId
            ? {
                ...c,
                points: c.points + score,
                badges: [...c.badges, { score, voterCode: currentVoter.code }],
              }
            : c
        )
        .sort((a, b) => b.points - a.points);

      const oldIdx = countries.findIndex((c) => c.id === clickedId);
      const newIdx = updatedList.findIndex((c) => c.id === clickedId);

      // Rows that will be pushed down (between newIdx and oldIdx)
      const displaced = new Set<string>();
      if (newIdx < oldIdx) {
        for (let i = newIdx; i < oldIdx; i++) {
          displaced.add(countries[i].id);
        }
      }
      setDisplacedIds(displaced);

      setIsAnimating(true);
      setFlyState({
        id: clickedId,
        code: clickedCountry.code,
        name: clickedCountry.name,
        newPoints: clickedCountry.points + score,
        addedScore: score,
        fromY: fromRect.top,
        fromX: fromRect.left,
        toY: fromRect.top,
        toX: fromRect.left,
        width: fromRect.width,
        height: fromRect.height,
      });
      setFlyPhase("measuring");

      // Update state
      setCountries(updatedList);

      // Update voted set
      setVotedThisRound((prev) => new Set([...prev, clickedId]));

      // Advance vote step
      if (voteStep < VOTE_ORDER.length - 1) {
        setVoteStep((s) => s + 1);
      } else {
        // Next voter
        setVoteStep(0);
        setVoterIdx((v) => v + 1);
        setVotedThisRound(new Set());
      }
    },
    [countries, currentScore, voteStep, isAnimating, currentVoter.id, votedThisRound]
  );

  // After rerender with new state — measure target and start flight
  useEffect(() => {
    if (flyPhase !== "measuring" || !flyState) return;

    const timer = setTimeout(() => {
      const targetEl = rowRefs.current[flyState.id];
      if (!targetEl) {
        finishAnimation();
        return;
      }
      const toRect = targetEl.getBoundingClientRect();

      setFlyState((prev) =>
        prev
          ? { ...prev, toY: toRect.top, toX: toRect.left, width: toRect.width, height: toRect.height }
          : null
      );
      setFlyPhase("flying");
    }, 40);

    return () => clearTimeout(timer);
  }, [flyPhase, flyState?.id]);

  // After animation ends
  const finishAnimation = useCallback(() => {
    setFlyState(null);
    setFlyPhase("idle");
    setIsAnimating(false);
    setDisplacedIds(new Set());
  }, []);

  const handleReset = () => {
    setCountries(INITIAL_COUNTRIES);
    setVoterIdx(0);
    setVoteStep(0);
    setFlyState(null);
    setFlyPhase("idle");
    setIsAnimating(false);
    setVotedThisRound(new Set());
    setDisplacedIds(new Set());
  };

  const sorted = [...countries];
  const leftCol = sorted.slice(0, 12);
  const rightCol = sorted.slice(12);

  // Flying row CSS
  const flyStyle: React.CSSProperties = (() => {
    if (!flyState) return { display: "none" };
    const isFlying = flyPhase === "flying";
    const dy = flyState.toY - flyState.fromY;
    const dx = flyState.toX - flyState.fromX;
    return {
      position: "fixed",
      top: flyState.fromY,
      left: flyState.fromX,
      width: flyState.width,
      height: flyState.height,
      zIndex: 9999,
      transform: isFlying
        ? `translate(${dx}px, ${dy}px) scale(1)`
        : "translate(0,0) scale(1.04)",
      transition: isFlying
        ? "transform 1100ms cubic-bezier(0.22, 0.61, 0.36, 1)"
        : "none",
      pointerEvents: "none",
    };
  })();

  const isBlocked = (id: string) =>
    id === currentVoter.id || votedThisRound.has(id);

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
          <img
            src={FLAG_URL(currentVoter.code)}
            className="esc-voter-flag-img"
            alt={currentVoter.name}
          />
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
          {leftCol.map((country) => {
            const isGhost = flyState?.id === country.id;
            const isDisplaced = displacedIds.has(country.id) && isAnimating;
            const blocked = isBlocked(country.id);
            return (
              <div
                key={country.id}
                ref={setRef(country.id)}
                className={[
                  "esc-row",
                  isGhost ? "esc-row--ghost" : "",
                  isDisplaced ? "esc-row--displaced" : "",
                  blocked ? "esc-row--blocked" : "",
                  !isAnimating && !blocked ? "clickable" : "",
                ].join(" ")}
                onClick={() => handleCountryClick(country.id)}
              >
                <img src={FLAG_URL(country.code)} className="esc-flag-img" alt={country.name} />
                <div className="esc-name">{country.name}</div>
                <div className="esc-badges">
                  {country.badges.map((b, i) => (
                    <div key={i} className="esc-last-score" title={`+${b.score} from ${b.voterCode}`}>
                      {b.score}
                    </div>
                  ))}
                </div>
                <div className="esc-pts">{country.points}</div>
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="esc-column esc-column--right">
          {rightCol.map((country) => {
            const isGhost = flyState?.id === country.id;
            const isDisplaced = displacedIds.has(country.id) && isAnimating;
            const blocked = isBlocked(country.id);
            return (
              <div
                key={country.id}
                ref={setRef(country.id)}
                className={[
                  "esc-row",
                  isGhost ? "esc-row--ghost" : "",
                  isDisplaced ? "esc-row--displaced" : "",
                  blocked ? "esc-row--blocked" : "",
                  !isAnimating && !blocked ? "clickable" : "",
                ].join(" ")}
                onClick={() => handleCountryClick(country.id)}
              >
                <img src={FLAG_URL(country.code)} className="esc-flag-img" alt={country.name} />
                <div className="esc-name">{country.name}</div>
                <div className="esc-badges">
                  {country.badges.map((b, i) => (
                    <div key={i} className="esc-last-score" title={`+${b.score} from ${b.voterCode}`}>
                      {b.score}
                    </div>
                  ))}
                </div>
                <div className="esc-pts">{country.points}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="esc-footer">
        <button className="esc-reset" onClick={handleReset}>
          ↺ RESET SCORES
        </button>
      </div>

      {/* Flying row clone */}
      {flyState && (
        <div
          style={flyStyle}
          onTransitionEnd={finishAnimation}
          className="esc-row esc-row--flying"
        >
          <img src={FLAG_URL(flyState.code)} className="esc-flag-img" alt={flyState.name} />
          <div className="esc-name">{flyState.name}</div>
          <div className="esc-score-bubble">{flyState.addedScore}</div>
          <div className="esc-pts">{flyState.newPoints}</div>
        </div>
      )}
    </div>
  );
}