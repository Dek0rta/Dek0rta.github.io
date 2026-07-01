import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { profile } from "../data";
import "./Issue.css";

// The cover behind the cover. On first paint the issue presents its own
// masthead — name, volume, dateline — then the sheet lifts away to reveal
// the real cover underneath. Frames the whole page as a printed issue.
export default function Issue({ onDone }) {
  const root = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // hold the page still while the sheet is up — no scrolling behind it
    const scrollY = window.scrollY;
    document.documentElement.classList.add("issue-locked");

    const finish = () => {
      document.documentElement.classList.remove("issue-locked");
      window.scrollTo(0, scrollY);
      setGone(true);
      onDone?.();
    };

    if (reduced) {
      // no theatre — hand off to the cover immediately
      const t = setTimeout(finish, 200);
      return () => clearTimeout(t);
    }

    const ctx = gsap.context(() => {
      // mastheads draws on, holds, then the whole sheet wipes up
      const lines = gsap.utils.toArray("[data-issue-line]");
      const rule = ".issue__rule-line";

      gsap.set(lines, { yPercent: 110 });
      gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({ onComplete: finish });
      tl.to(lines, {
        yPercent: 0,
        duration: 0.95,
        ease: "expo.out",
        stagger: 0.09,
        delay: 0.1,
      })
        .to(rule, { scaleX: 1, duration: 0.8, ease: "expo.out" }, "-=0.7")
        // hold the masthead so it reads
        .to({}, { duration: 0.55 })
        // sheet lifts: lines drift up + out, then the panel itself clears
        .to(
          lines,
          {
            yPercent: -120,
            duration: 0.8,
            ease: "power3.in",
            stagger: 0.05,
          },
          "wipe",
        )
        .to(rule, { autoAlpha: 0, duration: 0.3 }, "wipe")
        .to(
          root.current,
          {
            yPercent: -100,
            duration: 1.0,
            ease: "expo.inOut",
          },
          "wipe+=0.15",
        );
    }, root);

    return () => ctx.revert();
  }, [onDone]);

  if (gone) return null;

  return (
    <div className="issue" ref={root} aria-hidden="true">
      <div className="issue__inner">
        <p className="issue__kicker">
          <span data-issue-line>The Issue</span>
        </p>

        <h1 className="issue__name display">
          <span className="issue__mask">
            <span data-issue-line>{profile.first}</span>
          </span>
          <span className="issue__mask">
            <span data-issue-line>{profile.last}</span>
          </span>
        </h1>

        <div className="issue__rule">
          <span className="issue__rule-line" />
        </div>

        <p className="issue__meta">
          <span data-issue-line>
            {profile.volume} &nbsp;·&nbsp; {profile.year}
          </span>
        </p>
      </div>
    </div>
  );
}
