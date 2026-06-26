import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { languages } from "../data";
import "./Languages.css";

gsap.registerPlugin(ScrollTrigger);

export default function Languages() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fills = rootRef.current?.querySelectorAll("[data-fill]");
    if (!fills || !fills.length) return;

    if (reduced) {
      fills.forEach((el) => {
        el.style.transform = `scaleX(${el.dataset.fill})`;
      });
      return;
    }

    const ctx = gsap.context(() => {
      fills.forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: Number(el.dataset.fill),
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="lang-section" ref={rootRef}>
      <div className="wrap">
        <p className="eyebrow" data-reveal>Languages / Stack</p>

        <div className="lang-list">
          {languages.map((l) => (
            <div className="lang-row" key={l.name} data-reveal data-cursor>
              <div className="lang-row-head">
                <span className="lang-name">{l.name}</span>
                <span className="lang-note">{l.note}</span>
                <span className="lang-level">{l.level}%</span>
              </div>
              <div className="lang-bar">
                <div
                  className="lang-bar-fill"
                  data-fill={l.level / 100}
                  style={{ "--c": l.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
