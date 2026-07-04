import { socials, profile } from "../data";
import { ProofTotal } from "./Proof";
import "./Colophon.css";

const icons = {
  github: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 4.5 2.5 11.5l6 2 2 6 3-4 5 4z" />
      <path d="m8.5 13.5 9-7-6 9" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
};

function ContactLink({ social }) {
  return (
    <a
      className="colo__link"
      href={social.url}
      target="_blank"
      rel="noreferrer"
      data-cursor
    >
      <span className="colo__link-icon">{icons[social.icon]}</span>
      <span className="colo__link-name">{social.name}</span>
      <span className="colo__link-handle">{social.handle}</span>
    </a>
  );
}

export default function Colophon() {
  return (
    <footer className="section colophon site-footer" id="connect">
      <div className="wrap">
        <div className="folio" data-reveal>
          <span className="folio__no">05</span>
          <span className="folio__rule" />
          <span className="folio__label">Colophon</span>
        </div>

        <h2 className="colo__cta display" data-reveal>
          I&apos;m looking for the place that&apos;ll
          <span className="colo__em"> let me build at full size.</span>
        </h2>

        <div className="colo__links" data-reveal>
          {socials.map((s) => (
            <ContactLink key={s.name} social={s} />
          ))}
        </div>

        <div className="colo__base" data-reveal>
          <span>
            {profile.name} · {profile.volume} · {profile.year}
          </span>
          <span className="colo__base-note">
            Set in Fraunces &amp; JetBrains Mono. Built by hand with React, three.js &amp; GSAP.
          </span>
          <ProofTotal />
        </div>
      </div>
    </footer>
  );
}
