import { useRef } from "react";
import gsap from "gsap";
import { projects } from "../data";
import Tear from "./Tear";
// this very file, as text, at build time — the tear can't show a stale copy
import projectsSource from "./Projects.jsx?raw";
import "./Projects.css";

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

function Entry({ project }) {
  const ref = useRef(null);

  const fine = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e) => {
    if (!fine() || !project.featured) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, {
      rotateX: -py * 5,
      rotateY: px * 6,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1200,
    });
  };
  const onLeave = () => {
    if (!project.featured) return;
    gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "power3.out" });
  };

  return (
    <article
      className={`entry ${project.featured ? "entry--featured" : ""}`}
      data-reveal
    >
      <div className="entry__no">
        <span>{project.no}</span>
        <span className="entry__org">{project.org}</span>
      </div>

      <div
        className="entry__body"
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div className="entry__head">
          <h3 className="entry__name display">{project.name}</h3>
          <span className={`entry__metric ${project.live ? "is-live" : ""}`}>
            {project.live && <span className="entry__dot" />}
            {project.metric}
          </span>
        </div>

        <p className="entry__desc">{project.desc}</p>

        <div className="entry__foot">
          <div className="entry__tags">
            {project.tags.map((t) => (
              <span className="entry__tag" key={t}>
                {t}
              </span>
            ))}
          </div>
          <div className="entry__links">
            {project.live && (
              <a className="entry__link entry__link--seal" href={project.live} target="_blank" rel="noreferrer" data-cursor>
                Open it <Arrow />
              </a>
            )}
            {project.url && (
              <a className="entry__link" href={project.url} target="_blank" rel="noreferrer" data-cursor>
                Code <Arrow />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  return (
    <section className="section projects" id="shipped">
      <Tear source={projectsSource} filename="Projects.jsx">
        <div className="wrap">
          <div className="folio" data-reveal>
            <span className="folio__no">01</span>
            <span className="folio__rule" />
            <span className="folio__label">What I shipped</span>
          </div>

          <div className="projects__list">
            {projects.map((p) => (
              <Entry key={p.name} project={p} />
            ))}
          </div>
        </div>
      </Tear>
    </section>
  );
}
