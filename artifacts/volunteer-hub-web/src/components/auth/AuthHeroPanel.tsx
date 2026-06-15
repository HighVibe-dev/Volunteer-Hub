import volunteerPhoto from "@assets/image_1781511411041.png";
import { Handshake, Users, Sprout } from "lucide-react";

const STATS = [
  { value: "500+", label: "Volunteers" },
  { value: "120+", label: "Events" },
  { value: "10K+", label: "Hours Served" },
  { value: "28+",  label: "Districts" },
];

const FEATURES = [
  { Icon: Handshake, label: "Meaningful Opportunities" },
  { Icon: Users,     label: "Stronger Communities" },
  { Icon: Sprout,    label: "Sustainable Impact" },
];

export function AuthHeroPanel() {
  return (
    <div className="auth-hero-panel">
      <div className="auth-hero-photo" style={{ backgroundImage: `url(${volunteerPhoto})` }} />
      <div className="auth-hero-overlay" />

      <div className="auth-hero-content">
        <div className="auth-hero-logo">
          <img src="/nayepankh-logo.png" alt="NayePankh" className="auth-hero-logo-img" />
        </div>

        <div className="auth-hero-body">
          <h1 className="auth-headline">Together, We<br />Create Change</h1>
          <p className="auth-tagline">
            Join a community of passionate volunteers working towards a better tomorrow.
          </p>

          <ul className="auth-features">
            {FEATURES.map(({ Icon, label }) => (
              <li key={label} className="auth-feature-item">
                <Icon className="auth-feature-icon" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <div className="auth-stats-bar">
            {STATS.map((s, i) => (
              <div key={s.label} className="auth-stat-item">
                {i > 0 && <div className="auth-stat-divider" />}
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="auth-quote-card">
            <div className="auth-quote-mark">"</div>
            <p className="auth-quote-text">Volunteering is the ultimate exercise in democracy.</p>
            <p className="auth-quote-author">— Priya S., Volunteer</p>
          </div>
        </div>

        <div className="auth-hero-footer">
          © 2025 Naye Pankh Volunteer Hub. All rights reserved.
        </div>
      </div>
    </div>
  );
}
