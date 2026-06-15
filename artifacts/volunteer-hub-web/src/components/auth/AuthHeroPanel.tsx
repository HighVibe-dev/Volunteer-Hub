import { useEffect, useState, useRef } from "react";

const QUOTES = [
  { text: "Volunteering is the ultimate exercise in democracy.", author: "Priya S., Volunteer" },
  { text: "The meaning of life is to find your gift. The purpose is to give it away.", author: "Rahul M., Coordinator" },
  { text: "No one has ever become poor by giving.", author: "Anjali K., Volunteer" },
  { text: "We rise by lifting others.", author: "Suresh P., Team Lead" },
];

const STATS = [
  { end: 500, suffix: "+", label: "Volunteers" },
  { end: 120, suffix: "+", label: "Events" },
  { end: 10, suffix: "k+", label: "Hours" },
  { end: 28, suffix: "+", label: "Districts" },
];

function useCountUp(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

function StatCounter({ end, suffix, label, started }: { end: number; suffix: string; label: string; started: boolean }) {
  const count = useCountUp(end, 1800, started);
  return (
    <div className="auth-stat-card">
      <div className="auth-stat-value">{count}{suffix}</div>
      <div className="auth-stat-label">{label}</div>
    </div>
  );
}

export function AuthHeroPanel() {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [statsStarted, setStatsStarted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setStatsStarted(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % QUOTES.length);
        setQuoteVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={panelRef} className="auth-hero-panel">
      <div className="auth-hero-bg" />
      <div className="auth-hero-mesh" />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className={`auth-particle auth-particle-${i % 6}`} style={{
          left: `${8 + (i * 17) % 85}%`,
          top: `${5 + (i * 23) % 85}%`,
          animationDelay: `${i * 0.7}s`,
          animationDuration: `${4 + (i % 3) * 2}s`,
        }} />
      ))}

      {/* Abstract shape blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-hero-content">
        {/* Logo */}
        <div className="auth-logo-card auth-fade-up" style={{ animationDelay: "0.1s", background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "0.75rem 1.25rem", display: "inline-flex", alignItems: "center" }}>
          <img src="/nayepankh-logo.png" alt="NayePankh" style={{ height: "6rem", width: "auto", objectFit: "contain" }} />
        </div>

        <h1 className="auth-headline auth-fade-up" style={{ animationDelay: "0.25s" }}>
          Creating Change<br />Together
        </h1>

        <p className="auth-tagline auth-fade-up" style={{ animationDelay: "0.4s" }}>
          Join hundreds of passionate volunteers making a real difference across communities.
        </p>

        {/* Stat counters */}
        <div className="auth-stats auth-fade-up" style={{ animationDelay: "0.55s" }}>
          {STATS.map((s) => (
            <StatCounter key={s.label} end={s.end} suffix={s.suffix} label={s.label} started={statsStarted} />
          ))}
        </div>

        {/* Rotating quote card */}
        <div className={`auth-quote-card auth-fade-up ${quoteVisible ? "auth-quote-visible" : "auth-quote-hidden"}`}
          style={{ animationDelay: "0.7s" }}>
          <div className="auth-quote-mark">"</div>
          <p className="auth-quote-text">{QUOTES[quoteIdx].text}</p>
          <div className="auth-quote-author">— {QUOTES[quoteIdx].author}</div>
        </div>

        <p className="auth-registration auth-fade-up" style={{ animationDelay: "0.85s" }}>
          80G · 12A · UP Govt. Registered · www.nayepankh.com
        </p>
      </div>
    </div>
  );
}
