import { useState } from "react";

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

type Country = {
  id: string;
  name: string;
  flag: string;
  points: number;
};

export default function Index() {
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [voterIdx, setVoterIdx] = useState(0);
  const [voteStep, setVoteStep] = useState(0);
  const [flashId, setFlashId] = useState<string | null>(null);

  const currentVoter = VOTING_COUNTRIES[voterIdx % VOTING_COUNTRIES.length];
  const currentScore = VOTE_ORDER[voteStep];

  const handleCountryClick = (id: string) => {
    const score = currentScore;
    setFlashId(id);

    setTimeout(() => {
      setCountries((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, points: c.points + score } : c
        );
        return [...updated].sort((a, b) => b.points - a.points);
      });
      setTimeout(() => setFlashId(null), 400);
    }, 200);

    if (voteStep < VOTE_ORDER.length - 1) {
      setVoteStep((s) => s + 1);
    } else {
      setVoteStep(0);
      setVoterIdx((v) => v + 1);
    }
  };

  const handleReset = () => {
    setCountries(INITIAL_COUNTRIES);
    setVoterIdx(0);
    setVoteStep(0);
    setFlashId(null);
  };

  const sorted = [...countries];
  const leftCol = sorted.slice(0, 13);
  const rightCol = sorted.slice(13);

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
              className={`esc-row ${flashId === country.id ? "flash" : ""}`}
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
              className={`esc-row ${flashId === country.id ? "flash" : ""}`}
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
