import { useRef } from "react";
import gsap from "gsap";
import { projects } from "../data";
import "./Projects.css";

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

function ProjectCard({ project }) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const finePointer = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e) => {
    if (!finePointer()) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * 10;
    const ry = (px - 0.5) * 12;
    gsap.to(el, { rotateX: rx, rotateY: ry, duration: 0.4, ease: "power2.out", transformPerspective: 900 });
    if (glareRef.current) {
      gsap.to(glareRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        "--gx": `${px * 100}%`,
        "--gy": `${py * 100}%`,
      });
    }
  };

  const onLeave = () => {
    const el = cardRef.current;
    gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "elastic.out(1, 0.6)" });
    if (glareRef.current) gsap.to(glareRef.current, { opacity: 0, duration: 0.4 });
  };

  return (
    <article
      className="proj-card panel"
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-reveal
      data-cursor
    >
      <div className="proj-glare" ref={glareRef} aria-hidden="true" />
      <div className="proj-content">
        <h3 className="proj-name">{project.name}</h3>
        <p className="proj-desc">{project.desc}</p>

        <div className="proj-tags">
          {project.tags.map((t) => (
            <span className="proj-tag" key={t}>{t}</span>
          ))}
        </div>

        <div className="proj-links">
          {project.url && (
            <a className="proj-link" href={project.url} target="_blank" rel="noreferrer" data-cursor>
              <span>GitHub</span> <ArrowIcon />
            </a>
          )}
          {project.live && (
            <a className="proj-link proj-link-live" href={project.live} target="_blank" rel="noreferrer" data-cursor>
              <span>Live</span> <ArrowIcon />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  return (
    <section className="proj-section">
      <div className="wrap">
        <p className="eyebrow" data-reveal>Selected Work</p>
        <div className="proj-grid">
          {projects.map((p) => (
            <ProjectCard key={p.name} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
