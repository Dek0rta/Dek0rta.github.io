import { projects } from "../data";
import Tear from "./Tear";
import { ProofMark } from "./Proof";
// this very file, as text, at build time — the tear can't show a stale copy
import projectsSource from "./Projects.jsx?raw";
import "./Projects.css";

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

// screenshots set like figures in a printed feature: duotone ink until the
// cursor passes over — then the plate takes its colour pass.
function Plates({ project }) {
  return (
    <div className="plates">
      {project.plates.map((pl, i) => (
        <figure
          className={`plate ${pl.wide ? "plate--wide" : ""}`}
          key={pl.src}
          data-reveal
        >
          <a
            className="plate__frame"
            href={project.live || project.url}
            target="_blank"
            rel="noreferrer"
            data-cursor
            aria-label={`${project.name} — open live site`}
          >
            <img
              src={pl.src}
              alt={pl.alt}
              width={pl.w}
              height={pl.h}
              loading="lazy"
            />
          </a>
          <figcaption className="plate__caption">
            <span className="plate__fig">
              fig. {pl.fig || String(i + 1).padStart(2, "0")}
            </span>
            {pl.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// a bot has no screen to photograph — the issue prints a run transcript.
function Transcript({ data }) {
  return (
    <figure className="plate plate--transcript" data-reveal>
      <div className="transcript">
        <div className="transcript__meta">{data.meta}</div>
        {data.lines.map((l) => (
          <div className="transcript__line" key={l.t + l.text}>
            <span className="transcript__t">{l.t}</span>
            <span>{l.text}</span>
          </div>
        ))}
      </div>
      <figcaption className="plate__caption">
        <span className="plate__fig">fig. {data.fig || "01"}</span>
        {data.caption}
      </figcaption>
    </figure>
  );
}

function Entry({ project }) {
  return (
    <article
      className={`entry ${project.featured ? "entry--featured" : ""}`}
      data-reveal
    >
      <div className="entry__no">
        <span>{project.no}</span>
        <span className="entry__org">{project.org}</span>
      </div>

      <div className="entry__body">
        <div className="entry__head">
          <h3 className="entry__name display">{project.name}</h3>
          <span className={`entry__metric ${project.live ? "is-live" : ""}`}>
            {project.live && <span className="entry__dot" />}
            {project.metric}
          </span>
        </div>

        <p className="entry__desc">{project.desc}</p>

        {project.facts && (
          <ul className="entry__facts">
            {project.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}

        {project.plates && <Plates project={project} />}
        {project.transcript && <Transcript data={project.transcript} />}

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
            <span className="folio__no">02</span>
            <span className="folio__rule" />
            <span className="folio__label">What I shipped</span>
            <ProofMark k="shipped" />
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
