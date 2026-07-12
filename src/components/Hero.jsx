import { useEffect, useRef, useState } from "react";
import { profile, headline } from "../data";
import portrait from "../assets/portrait.png";
import "./Hero.css";

export default function Hero() {
  const [count, setCount] = useState(0);
  const seal = useRef(null);

  // count 0 → liveUsers once, paced with an ease-out. this is the ONE true
  // figure — the real SAT Portal user count. no invented tick-up: a portfolio
  // that sells "no filler, just the record" can't fake a live number.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(headline.liveUsers);
      return;
    }
    let raf;
    const start = performance.now();
    const dur = 1800;
    const delay = 1200; // let the cover land, then run the count
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start - delay) / dur));
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * headline.liveUsers));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="hero" id="cover">
      <div className="wrap hero__inner">
        {/* ── left: the masthead ── */}
        <div className="hero__lead">
          <p className="hero__folio" data-hero="1">
            <span className="hero__folio-no">00</span>
            <span className="hero__folio-label">Cover</span>
          </p>

          <h1 className="hero__title display">
            <span className="hero__line" data-hero="2">
              <span className="hero__line-inner">Self-taught</span>
            </span>
            <span className="hero__line" data-hero="3">
              <span className="hero__line-inner">software engineer</span>
            </span>
            <span className="hero__line hero__line--em" data-hero="4">
              <span className="hero__line-inner">building things people</span>
            </span>
            <span className="hero__line hero__line--em" data-hero="5">
              <span className="hero__line-inner">actually use.</span>
            </span>
          </h1>

          {/* foot of the masthead: live seal + colophon line */}
          <div className="hero__foot">
          <div className="hero__seal" ref={seal} data-hero="6">
            <span className="hero__seal-mark">◆</span>
            <span className="hero__seal-num">
              {count}+
            </span>
            <span className="hero__seal-label">
              {headline.liveLabel}
            </span>
            <span className="hero__pip" aria-hidden="true">
              <span className="hero__pip-dot" />
            </span>
          </div>

          <p className="hero__sig" data-hero="8">
            {profile.name}, <em>{profile.location}</em>
            <br />
            shipping since {profile.shippingSince}.
          </p>
          </div>
        </div>

        {/* ── right: the portrait plate, bled to the edge ── */}
        <figure className="hero__figure" data-hero="7">
          <span className="hero__arc" aria-hidden="true" />
          <span className="hero__dots" aria-hidden="true" />
          <span className="hero__diamond" aria-hidden="true" />
          <span className="hero__rule" aria-hidden="true" />
          <div className="hero__portrait">
            <img src={portrait} alt={`Portrait of ${profile.name}`} />
          </div>
        </figure>
      </div>
    </section>
  );
}
